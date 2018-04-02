const { youtube_api_key } = require('../config.json');
const { memory_size } = require('../settings.json');
const Song = require('./song.js');
const YouTube = require('youtube-node');
const ytdl = require('ytdl-core');
const axios = require('axios');
const moment = require('moment');

yt = new YouTube();
yt.setKey(youtube_api_key);

const lib = {

    Song: class YouTubeSong extends Song {
        
        constructor(args) {
            super(args);
        }
    
        play() {
            return ytdl(this.link, { filter: 'audioonly' });
        }
    
        related(history) {
            return new Promise((resolve, reject) => {
                yt.related(this.id, memory_size + 5,
                (error, result) => {

                    if (error) {
                        console.log(error);
                        return reject(error);
                    }

                    if (!history) history = [];
                    history = history.map(elem => elem.id);
                    const remaining = result.items.reduce(
                        (prev, elem) => {
                            const id = elem.id.videoId;
                            if (history.indexOf(id) != -1)
                                return prev;
                            prev.push(id);
                            return prev;
                        }, []);
                    const rand = Math.round(Math.random() * 
                        (remaining.length - 1));

                    lib.getById(remaining[rand])
                        .then((result, error) => {
                            if (error) return reject(error);
                            return resolve(result);
                        });
                        
                });
            });
        }
    },

    /**
     * Populate a YouTube Song object with fields fetched from id(s)
     * @param {String || Array<String>} id
     * @param {Object} message
     * @returns {YouTubeSong || undefined}
     */
    getById: (id, message) => {
        return new Promise((resolve, reject) => {
            // ...
            if(Array.isArray(id)) id = id.join(',');
            //console.log('id:', id);
            yt.getById(id, (error, result) => {
                // return undefined if the request failed
                if (error) {
                    console.log(error);
                    return resolve(undefined); // reject to error
                }
                // return undefined if response object is faulty in 
                // any way
                if (!result || !result.items ||
                result.items.length == 0) {
                    return resolve(undefined);
                }
                const output = result.items.map(elem => 
                    // expect response object to be ok and construct 
                    // and return new YouTube Song object
                    new lib.Song({
                        link: 
                        `https://www.youtube.com/watch?v=${elem.id}`,
                        id: elem.id,
                        message: message,
                        title: elem.snippet.title,
                        artist: elem.snippet.channelTitle,
                        thumbnail: elem.snippet.thumbnails.default
                            .url,
                        plays: elem.statistics.viewCount,
                        duration: moment.duration(
                            elem.contentDetails.duration)
                            .asSeconds(),
                    })
                );
                if (output.length == 1) return resolve(output[0])
                return resolve(output);
            });
        })
    },

    getPlaylistById: async (id, message) => {
        return new Promise(async (resolve, reject) => {
            let output = [];
            let pageToken = 'placeholder';
            while (pageToken) {

                const items = await new Promise(async (resolve, reject) => 
                {
                    await axios.get('https://www.googleapis.com/' +
                    'youtube/v3/playlistItems' +
                    `?key=${youtube_api_key}` +
                    '&maxResults=50' +
                    '&part=snippet,id,contentDetails' +
                    (pageToken !== 'placeholder' ?
                    `&pageToken=${pageToken}` : '') +
                    `&playlistId=${id}`)
                    .then(async response => {
                        result = response.data;

                        if (!result || !result.items ||
                        result.items.length == 0) {
                            // say something?
                            return resolve(undefined);
                        }

                        const ids = result.items.map(elem => 
                            elem.snippet.resourceId.videoId);
                        const videos = lib.getById(ids, message);

                        if (pageToken && result.nextPageToken != 
                        pageToken) {
                            pageToken = result.nextPageToken;
                        } else {
                            pageToken = undefined;
                        }

                        return resolve(await videos);

                    })
                    .catch(error =>
                        resolve(undefined)
                    );
                });

                if (!items) return resolve(undefined);
                items.forEach(elem => output.push(elem));
            }
            return resolve(output);
        });
    }

}

module.exports = lib;
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
    getById: (id, message) =>
        new Promise((resolve, reject) => {
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
    ,

    getPlaylistById: async (id, message) =>
        new Promise(async (resolve, reject) => {
            let output = [];
            let pageToken = 'placeholder';
            let totalResults;
            let i = 0;
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
                        const result = response.data;
                        totalResults = result.pageInfo.totalResults;
                        i++;

                        if (!result || !result.items ||
                        result.items.length == 0) {
                            await message.send('an error occured!');
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

                        resolve(await videos);

                    })
                    .catch(() => resolve(undefined));
                });

                if (!items) {
                    await message.send('an error occured!');
                    return resolve(undefined);
                }
                const percent = Math.round(
                    (100 / (totalResults / 50) * i));
                if (totalResults > 50 && percent < 100) 
                    message.send(`processing... ${percent}%`);
                items.forEach(elem => output.push(elem));
            }
            return resolve(output);
        })
    ,

    search: async (query, message) => 
        new Promise(async (resolve, reject) => {
            yt.search(query, 1, { 'type': 'video,playlist' }, 
            async (error, result) => {
                //result.items.forEach(elem => console.log(elem.snippet.title))
                if (error) {
                    message.send(error);
                    return resolve(undefined);
                }
                if (result.items.length == 0)
                    return resolve(undefined);
                const id = result.items[0].id
                if (id.kind === 'youtube#video') {
                    return resolve(await lib.getById(id.videoId, 
                        message));
                }
                else {
                    return resolve(await lib.getPlaylistById(
                        id.playlistId, message));
                }
            });
        })

}

module.exports = lib;
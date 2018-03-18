const { youtube_api_key } = require('../config.json');
const { memory_size } = require('../settings.json');
//const { getById } = require('./util.js');
const Song = require('./song.js');
const YouTube = require('youtube-node');
const ytdl = require('ytdl-core');

yt = new YouTube();
yt.setKey(youtube_api_key);

const lib = {

    Song: class YouTubeSong extends Song {
        
        constructor(args) {
            super(args);
            this.yt = args.yt;
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

    getById: (id, message) => {
        return new Promise((resolve, reject) => {
            yt.getById(id, (error, result) => {
                if (error) {
                    console.log(error);
                    return reject(error);
                }
                if (result.items.length == 0) {
                    return resolve(undefined);
                }
                return resolve({
                    link: `https://www.youtube.com/watch?v=${id}`,
                    id: result.items[0].id,
                    message: message,
                    title: result.items[0].snippet.title,
                    artist: result.items[0].snippet.channelTitle,
                    thumbnail: result.items[0].snippet.thumbnails.default.url,
                    plays: result.items[0].statistics.viewCount,
                    duration: result.items[0].contentDetails.duration,
                    yt: yt
                });
            });
        })
    }

}

module.exports = lib;
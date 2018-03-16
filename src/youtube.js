const { youtube_api_key } = require('../config.json');
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
                yt.related(this.id, history.length + 1,
                (error, result) => {
                    if (error) {
                        console.log(error);
                        reject(error);
                    }
                    else {
                        result.items.forEach(elem => {
                            const id = elem.id.videoId;
                            if (history.indexOf(id) == -1) {
                                return resolve(lib.getById(id));
                            }
                        });
                    }
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
                else {
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
                }
            });
        })
    }

}

module.exports = lib;
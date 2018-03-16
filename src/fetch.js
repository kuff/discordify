const { youtube_api_key } = require('../config.json');
const { URL, parse } = require('url');
const { isUri } = require('valid-url');
const { Song, getById } = require('./youtube.js');
const YouTube = require('youtube-node');

yt = new YouTube();
yt.setKey(youtube_api_key);

module.exports = class Fetch {

    constructor() {
        this.queue = [];
        this.processing = false;
        // ...
    }

    search(query, args) {
        this.queue.push()
        if (!processing) {
            this.processing = true;
            while(queue.length != 0) {
                // ...
            }
            this.processing = false;
        }
    }
    
    // ...

}

/*async function search(query, message, own, args) {
    if(isUri(query)) {
        const url = parse(query);

        switch(url.hostname) {
            case 'www.youtube.com':
            case 'www.youtu.be':
                const url = new URL(query);
                const id = url.searchParams.get('v');
                if (!id) {
                    // ...
                }
                else {
                    return getById(id, 
                    (error, result) => {
                        if (error) {
                            console.log(error)
                        }
                        else {
                            console.log(data);
                            data.yt = yt;
                            const song = new YouTubeSong(data);
                            if(song.isValid()) {
                                return song;
                            }
                        }
                    });
                }
                break;

            // For future audio sources...
        }
    }
    // Search...
}*/
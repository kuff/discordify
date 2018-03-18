const { default_volume } = require('../settings.json');
//const { playing, queued } = require('./embeds.js');

module.exports = class Playback {
    
    constructor(client, queue, fetcher) {
        this.client = client;
        this.queue = queue;
        this.fetch = fetcher;
        this.playing = undefined; // should contain song when playing
        this.playback_start = undefined; // time since playback
        this.paused = undefined; // time since playback paused
        this.volume = default_volume;
        this.skipped = false;
    }

    play(song) {
        //let own = await message.reply('processing...');
        // ...
    }

    pause(seconds) {
        // ...
    }

    resume() {
        // ...
    }

    remaining() {
        // ...
    }
    
    skip(amount) {
        this.skipped = true;
        // ...
    }

    replay() {
        // ...
    }
    
    jump(seconds, message) {
        if(this.song) {
            return this.play(
                this.song.jump(this.playback_start, seconds, 
                    message)
            );
        }
        // Nothing is playing!
    }

    volume(val) {
        // ...
    }

    terminate() {
        this.queue.clear();
        this.playing = false;
        this.playback_start = undefined;
        this.paused = false;
        this.volume = default_volume;
        this.skipped = false;
        // ...
    }

}
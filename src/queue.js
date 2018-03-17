const { memory_size } = require('../settings.json');
const { shuffle } = require('./util.js');

module.exports = class Queue {

    constructor() {
        this.queue = [];
        this.history = [];
    }

    enqueue(song, args) {
        if (!Array.isArray(song)) song = [song];

        for (let i = 0; i < song.length; i++) {
            song[i].flags = args;
        }

        if (args) {
            if (args.indexOf('shuffle') != -1)
                song = shuffle(song);
            if (args.indexOf('now') != -1) {
                this.queue.forEach(elem => song.push(elem));
                this.queue = song.slice();
                return;
            }
        }

        song.forEach(elem => this.queue.push(elem));
    }

    dequeue(skipped) {
        let song = this.queue.shift();
        const prev = this.history.pop()

        if (prev) {
            if (prev.flags && prev.flags.indexOf('loop') != -1 && 
            !skipped) {
                this.queue.unshift(song);
                song = prev;
            }
            else if (!song && prev.flags && 
            prev.flags.indexOf('autoplay') != -1) {
                song = prev.related(this.history);
                song.flags = [ 'autoplay' ];
            }
            else {
                this.history.push(prev)
            }
        }

        if (song && !(this.peek(this.history) === song)) {
            if (this.history.length == memory_size) this.history.shift();
            this.history.push(song);
        }
        return song;
    }

    peek(list = this.queue) {
        if (list === this.history) {
            return this.history[this.history.length - 1]
        }
        return this.queue[0];
    }

    print() {
        // ...
    }

    clear() {
        this.queue = [];
    }

}
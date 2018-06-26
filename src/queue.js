const { memory_size } = require('../settings.json');
const { shuffle } = require('./util.js');

module.exports = class Queue {

    constructor() {
        this.queue = [];
        this.history = [];
        this.size = () => this.queue.length;
    }

    enqueue(song, args) {
        if (!Array.isArray(song)) song = [song];

        for (let i = 0; i < song.length; i++) {
            song[i].flags = args;
        }

        if (args) {
            if (args.indexOf('shuffle') != -1)
                song = shuffle(song);
            if (args.indexOf('next') != -1) {
                this.queue.forEach(elem => song.push(elem));
                this.clear();
            }
        }

        song.forEach(elem => this.queue.push(elem));
    }

    async dequeue(skipped) {
        let song = this.queue.shift();
        const prev = this.history.pop()

        if (prev) {
            if (prev.flags && prev.flags.indexOf('loop') != -1 && 
            !skipped) {
                if (song) this.queue.unshift(song);
                song = prev ? prev : song;
            }
            else if (!song && prev.flags && 
            prev.flags.indexOf('autoplay') != -1) {
                song = await prev.related(this.history);
                song.flags = [ 'autoplay' ];
                this.history.push(prev)
            }
            else {
                this.history.push(prev)
            }
        }

        if (song && !(this.peek(this.history) === song)) {
            if (this.history.length == memory_size) 
                this.history.shift();
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

    clear() {
        this.queue = [];
        //this.history = [];
    }

}
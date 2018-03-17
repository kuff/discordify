const { memory_size } = require('../settings.json');
const { shuffle } = require('./util.js');

module.exports = class Queue {

    constructor() {
        this.queue = [];
        this.history = [];
    }

    enqueue(song, args) {
        if (Array.isArray(song)) {
            for (let i = 0; i < song.length; i++) {
                song[i].flags = args;
            }
            if (args && args.indexOf('shuffle') != -1) {
                song = shuffle(song);
                song.reduce((prev, val) => {
                    val.flags.splice(val.flags.indexOf('shuffle'), 1)
                    prev.push(val);
                    return prev;
                }, []);
            }
            song.forEach(elem => this.queue.push(elem))
        }
        else {
            song.flags = args;
            this.queue.push(song);
        }
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
        this.history = [];
    }

}
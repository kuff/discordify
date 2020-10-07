const { memory_size, always_autoplay } = require("../settings.json");
const { shuffle } = require("./util.js");

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
      if (args.indexOf("shuffle") !== -1) song = shuffle(song);
      if (args.indexOf("next") !== -1) {
        this.queue.forEach(elem => song.push(elem));
        this.clear();
      }
    }

    // always autoplay if configured in settings.json
    if (always_autoplay && (!args || args.indexOf("autoplay") === -1))
      song.forEach(elem => elem.flags = ["autoplay"]);  // this might break future flags

    song.forEach(elem => this.queue.push(elem));
  }

  async dequeue(skipped) {
    let song = this.queue.shift();
    const prev = this.history.pop();

    if (prev) {
      if (prev.flags && prev.flags.indexOf("loop") !== -1 && !skipped) {
        if (song) this.queue.unshift(song);
        song = prev ? prev : song;
      } else if (!song && prev.flags && prev.flags.indexOf("autoplay") !== -1) {
        song = await prev.related(this.history);
        song.flags = ["autoplay"];
        this.history.push(prev);
      } else {
        this.history.push(prev);
      }
    }

    if (song && !(this.peek(this.history) === song)) {
      if (this.history.length === memory_size) this.history.shift();
      this.history.push(song);
    }
    return song;
  }

  removeAll(messageId, message) {
    const oldQueueSize = this.size();

    // debuggerino
    this.queue.forEach(elem => console.log("target id: " + messageId + ". entry id: " + elem.message.obj.id));

    this.queue = this.queue.filter(item => item.message.obj.id !== messageId);
    const itemsSkipped = 1 + oldQueueSize - this.size();
    message.send(`skipping ${itemsSkipped} entr${itemsSkipped == 1 ? "y" : "ies"}...`);
  }

  peek(list = this.queue) {
    if (list === this.history) {
      return this.history[this.history.length - 1];
    }
    return this.queue[0];
  }

  clear() {
    this.queue = [];
    //this.history = [];
  }
};

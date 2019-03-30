module.exports = /*abstract*/ class Song {
    
    constructor(args) {
        this.link = args.link;
        this.id = args.id;
        this.message = args.message;
        this.title = args.title;
        this.artist = args.artist;
        this.thumbnail = args.thumbnail;
        this.plays = args.plays;
        this.duration = args.duration;
    }

    isValid() {
        return this.message !== undefined
            && this.link !== undefined;
    }
    
}
const { self_id } = require('../config.json');
const { prefix } = require('../settings.json');

module.exports = {

    ping: async message => {
        const before = Date.now();
        const own = await message.send("pinging...");
        return Date.now() - before;
        // Return is only done for testing purposes
    },

    formatTime: duration => {
        const seconds = duration % 60; // Leftover seconds
        const minutes = Math.floor(duration / 60);
        const hours = Math.floor(minutes / 60);
        return (hours > 0 ? hours + ":" : "")
            + (minutes % 60 < 10 ?
                (hours == 0 ? "" : "0") : "")
            + minutes % 60 + ":"
                + (seconds < 10 ? "0" : "")
                + seconds;
    },

    formatPlays: views => {
        if (views < 1000) return views.toString();

        const views_number = views;
        const views_string = views_number.toString();
        let output = '';

        for (i = 0; 3 + i <= views_string.length;) {
            if (i > 0 || views_string.length % 3 == 0) {
                output += views_string.slice(i, 3 + i);
                i += 3;
            }
            else {
                output += views_string.slice(i, views_string.length % 3)
                i += views_string.length % 3;
            }
            output += '.';
        }

        return output.substring(0, output.length - 1);
    },

    shuffle: deck => {
        if (!Array.isArray(deck))
            throw new Error("Parameter Must Be An Array");
        let randomizedDeck = [];
        let array = deck.slice();
        while (array.length !== 0) {
            let rIndex = Math.floor(array.length * Math.random());
            randomizedDeck.push(array[rIndex]);
            array.splice(rIndex, 1);
        }
        return randomizedDeck;
    },

    setPresence: instance => {
        if (instance.playing) return instance.client.user
        .setPresence({
            status: 'online',
            game: {
                name: `at ${instance.setVolume()}% volume`
            }
        })
        instance.client.user.setPresence({
            status: 'idle',
            game: {
                name: `nothing | ${prefix}help`
            }
        })
    },

    inVoice: member => {
        try {
            const map = member.voiceChannel.members;
            const array = Array.from(map.keys());
            return array.includes(self_id);
        }
        catch (error) {
            return false;
        }
    },

    enqueue: (pb, q, song, message, args, embeds) => {
        if (!song) return console.log('song: found nothing');
        console.log('song:', Array.isArray(song)
            ? `${song.length} items fetched`
            : `fetched ${song.link}`);
        // remember the current queue length for use in
        // queued embed
        const queue = pb.queueTime();
        // enqueue fetched song(s)
        q.enqueue(song, args);
        // play the first song in queue if nothing is play-
        // ing, else notify the user that their song request
        // was queued
        if (!pb.playing) return pb.play();
        message.send(embeds.queued(pb, song, queue));
    }
    
}
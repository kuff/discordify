const { youtube_api_key } = require('../config.json');
const embeds = require('./embeds.js');
const YouTube = require('youtube-node');

module.exports = {

    ping: async (client, message) => {
        const before = Date.now();
        const own = await message.reply("pinging...");
        const roundtime = Date.now() - before;
        // Return is only done for testing purposes
        return own.edit(embeds.ping(client, roundtime));
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

    formatViews: views => {
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
        /*return array.reduce((shuffled, x, i) => {
            if(i == 0) shuffled = array;
            const target = Math.floor(Math.random() * 
                shuffled.length);
            shuffled[i] = shuffled[target];
            shuffled[target] = x;
            return shuffled;
        }, []);*/
        let randomizedDeck = [];
        let array = deck.slice();
        while (array.length !== 0) {
            let rIndex = Math.floor(array.length * Math.random());
            randomizedDeck.push(array[rIndex]);
            array.splice(rIndex, 1);
        }
        return randomizedDeck;
    }
    
}
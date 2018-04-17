const { version } = require('../package.json');
const { embed_color } = require('../settings.json');
const { formatPlays, formatTime } = require('./util.js');

module.exports = {

    ping: (client, roundtime) => {
        return {
            embed: {
                color: embed_color,
                footer: {
                    text: `Discordify v${version} (beta) • A heatbeat is sent every 45 seconds`
                },
                fields: [
                    {
                        name: "Latest heatbeat",
                        value: "`" + client.pings[0] + " ms`",
                        inline: true
                    },
                    {
                        name: "Avarage",
                        value: "`" + Math.round(client.ping) + " ms`",
                        inline: true
                    },
                    {
                        name: "Message round-time",
                        value: "`" + roundtime + " ms`",
                        inline: true
                    }
                ]
            }
        }
    },

    playing: instance => {
        const client = instance.client;
        const song = instance.playing;
        const queue = instance.queue;
        const duration = song.duration == 0 ? '∞' : formatTime(song.duration);

        // generate embed
        const embed = {
            embed: {
                title: song.title,
                description: "by *" + song.artist + "*",
                url: song.link,
                color: embed_color,
                footer: {
                    icon_url: song.message.author.avatarURL,
                    text: "Suggested by " + song.message.author
                        .username
                },
                thumbnail: {
                    url: song.thumbnail
                },
                author: {
                    name: duration
                },
                fields: []
            }
        };

        const next = queue.peek();
        if (next) {
            embed.embed.fields[0] = {
                name: "Up next",
                value: "*" + next.title + "*\n" + 
                    "by *" + next.artist + "*"
            }
            embed.embed.footer.text += 
                ` • ${queue.size()} item${
                    queue.size() > 1 ? 's' : ''
                } in queue • ${instance.queueTime()} queue time`;
        }
        return embed;
    },

    queued: (instance, song, queue_length) => {
        const client = instance.client;
        const queue = instance.queue;
        const playing = instance.playing;
        /*const time_till_next_song = playing.duration - instance
            .dispatcher.totalStreamTime;*/
        
        let duration
        let songs;
        if (Array.isArray(song)) {
            songs = song;
            /*song = songs.reduce((cum, elem) => {
                if (elem.plays > cum.plays) return elem;
                return cum;
            });*/
            song = songs[0]
            duration = instance.queueTime(songs);
        }
        else duration = formatTime(song.duration);

        /*let cum_duration;
        if (songs) cum_duration = songs.reduce((cum, elem) => 
                cum += elem.duration, 0);
        else cum_duration = song.duration;*/

        // generate embed
        return embed = {
            embed: {
                title: song.title,
                description: "by *" + song.artist + "*",
                url: song.link,
                color: embed_color,
                footer: {
                    icon_url: song.message.author.avatarURL,
                    text: `Currently playing ${playing.title} 
                        by ${playing.artist}`
                },
                thumbnail: {
                    url: song.thumbnail
                },
                author: {
                    name: `Queued ${songs ? `${songs.length} 
                        items, starting with:` : 'an item:'}`
                },
                fields: [
                    {
                        name: "Duration",
                        value: "`" + (song.duration == 0
                            ? "∞"
                            : duration
                        ) + "`",
                        inline: true
                    },
                    {
                        name: "Queue time",
                        value: "`" + queue_length + "`",
                        inline: true
                    }
                ]
            }
        };
    }
    
}
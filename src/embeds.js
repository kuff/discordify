const version = require('../package.json').version;
const { embed_color } = require('../settings.json');
const { formatPlays, formatTime } = require('./util.js');

module.exports = {

    ping: (client, roundtime) => {
        return {
            embed: {
                color: embed_color,
                footer: {
                    text: `A heatbeat is sent every 45 seconds • Discordify v${version} (beta)`
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

    playing: (client, song, queue) => {
        // generate embed
        const embed = {
            embed: {
                title: song.title,
                description: "by *" + song.artist + "*",
                url: song.link,
                color: embed_color,
                footer: {
                    icon_url: song.message.author.avatarURL,
                    text: "Requested by " + song.message.author
                        .username
                },
                thumbnail: {
                    url: song.thumbnail
                },
                author: {
                    name: "PUT DURATION HERE"
                },
                fields: [
                    {
                        name: "Plays",
                        value: "`" + formatPlays(song.plays) + "`",
                        inline: true
                    },
                    {
                        name: "Duration",
                        value: "`" + (song.duration == 0 
                            ? "🔴 LIVE" 
                            : formatTime(song.duration)
                        ) + "`",
                        inline: true
                    }
                ]
            }
        };
        const next = queue.peek();
        if (next) {
            embed.embed.fields[0] = embed.embed.fields[1];
            embed.embed.fields[1] = {
                name: "Up next",
                value: "*" + next.title + "*\n" + 
                    "by *" + next.artist + "*",
                inline: true
            }
            embed.embed.footer.text += 
                ` • ${queue.size()} item${
                    queue.size() > 1 ? 's' : ''
                } in queue • queue time: ${queue.queueTime()}`;
        }
        return embed;
    }/*,

    queue: (client, song, queue) => {
        let songs;
        if (Array.isArray(song)) {
            songs = song;
            song = songs[0];
        }
        const currentSong = queue.peek(queue.history);
        const embed = {
            embed: {
                title: song.title,
                description: "by *" + song.artist + "*",
                url: song.link,
                color: embed_color,
                footer: {
                    icon_url: song.message.author.avatarURL,
                    text: `Currently playing *${currentSong.title}* 
                        by *${currentSong.artist}* • next song plays 
                        in MATH...`
                },
                thumbnail: {
                    url: song.thumbnail
                },
                author: {
                    name: "Queued"
                },
                fields: [
                    {
                        name: "Duration",
                        value: "`" + (song.duration == 0
                            ? "🔴 LIVE"
                            : formatTime(song.duration)
                        ) + "`",
                        inline: true
                    },
                    {
                        name: "Queue time",
                        value: "`" + queue.queueTime() + "`",
                        inline: true
                    }
                ]
            }
        };
    }*/
    
}
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

    playing: (song, next) => {
        const embed = {
            embed: {
                title: song.title,
                description: "by `" + song.artist + "`",
                url: song.link,
                color: embed_color,
                footer: {
                    icon_url: song.message.author.avatarURL,
                    text: "Requested by " + song.message.author.username
                },
                thumbnail: {
                    url: song.thumbnail
                },
                author: {
                    name: "Now playing"
                },
                fields: [
                    {
                        name: "Plays",
                        value: "`" + formatPlays(song.plays) + "`",
                        inline: true
                    },
                    {
                        name: "Duration",
                        value: "`" + formatTime(song.duration) + "`",
                        inline: true
                    }
                ]
            }
        };
        if (next) {
            embed.embed.fields[2] = {
                name: "Up next",
                value: "`" + next.title + "`" + 
                    "by `" + next.artist + "`\n"
            }
        }
        return embed;
    },

    queue: () => {
        // ...
    }
    
}
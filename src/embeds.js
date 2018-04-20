const { version } = require('../package.json');
const { embed_color, prefix } = require('../settings.json');
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
        const duration = song.duration == 0 ? '∞' : 
            formatTime(song.duration);

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
        
        let duration
        let songs;
        if (Array.isArray(song)) {
            songs = song;
            song = songs[0]
            duration = instance.queueTime(songs);
        }
        else duration = formatTime(song.duration);

        if (queue.peek() === song) queue_length = formatTime(
            Math.round(playing.duration - (instance.dispatcher
            .time / 1000)));

        // generate embed
        return embed = {
            embed: {
                title: song.title,
                description: "by *" + song.artist + "*",
                url: song.link,
                color: embed_color,
                footer: {
                    icon_url: playing.message.author.avatarURL,
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
    },
    
    remaining: instance => {
        const client = instance.client;
        const queue = instance.queue;
        const playing = instance.playing;
        const time_played = formatTime(Math.round(instance
            .dispatcher.time / 1000)) + 
            (instance.dispatcher.paused ? ' (paused)' : '');

        // generate embed
        const embed = {
            embed: {
                title: playing.title,
                description: "by *" + playing.artist + "*",
                url: playing.link,
                color: embed_color,
                footer: {
                    icon_url: playing.message.author.avatarURL,
                    text: 'Suggested by ' + playing.message.author
                        .username + ' • nothing in queue'
                },
                thumbnail: {
                    url: playing.thumbnail
                },
                author: {
                    name: 'Currently playing:'
                },
                fields: [
                    {
                        name: "Time played",
                        value: "`" + time_played + "`",
                        inline: true
                    },
                    {
                        name: "Remaining",
                        value: "`" + (playing.duration == 0
                            ? "∞"
                            : formatTime(Math.round(playing
                                .duration - instance.dispatcher
                                .time / 1000))
                        ) + "`",
                        inline: true
                    }
                ]
            }
        };

        const next = queue.peek();
        if (next) {
            embed.embed.fields[2] = {
                name: "Up next",
                value: "*" + next.title + "*\n" +
                    "by *" + next.artist + "*"
            }
            embed.embed.footer.text =
                `Suggested by ${playing.message.author.username} • 
                ${queue.size()} item${queue.size() > 1 ? 's' : ''} 
                in queue • ${instance.queueTime()} queue time`;
        }
        return embed;
    },

    help: () => {
        return {
            embed: {
                color: embed_color,
                author: {
                    name: 'Help has arrived!'
                },
                description: 'Following is a list of all ' +
                    'available commands, explaining how to use ' +
                    'them and what they do.',
                fields: [
                    {
                        name: '`' + prefix + 'help`',
                        value: 'Sends a table of all ' +
                            'available commands as a direct ' +
                            'message to the issuer (this)\n~'
                    },
                    {
                        name: '`' + prefix + 'ping`',
                        value: 'Shows the heartbeat ping ' +
                            'and performs a message-round-time ' +
                            'measurement\n~'
                    },
                    {
                        name: '`' + prefix + 'play <params> --flags?`',
                        value: 'Attempts to fetch the song given ' +
                            'as a parameter and initiates playback' +
                            ' if successful\n\n' +
                            '       **aliases:** `song`, `s`\n' +
                            '       **supported params:** YouTube video- or playlist links as well as search queries\n' +
                            '       **supported flags: (optional)**\n' +
                            '               `shuffle`: shuffles the requested playlist\n' +
                            '               `next`: inserts requested item(s) at the start of the queue\n' +
                            '               `loop`: loops the requested item(s) until skipped with `' + prefix + 'skip`\n' +
                            '               `autoplay`: automatically queues related songs when the requested item finishes playing and the queue is empty\n' +
                            '       **conditions:** you must be in a voice channel to use this command and if music is already playing, you must be in the same voice channel as the bot\n~'
                    },
                    {
                        name: '`' + prefix + 'pause`',
                        value: 'Pauses playback\n\n' +
                            '       **aliases:** `p`\n' +
                            '       **conditions:** you must be in the same voice channel as the bot and it has to be playing\n~'
                    },
                    {
                        name: '`' + prefix + 'resume`',
                        value: 'Resumes playback\n\n' +
                            '       **aliases:** `unpause`, `up`\n' +
                            '       **conditions:** you must be in the same voice channel as the bot and playback has to be paused\n~'
                    },
                    {
                        name: '`' + prefix + 'skip`',
                        value: 'Skips the items currently playing\n\n' +
                            '       **aliases:** `next`\n' +
                            '       **conditions:** you must be in the same voice channel as the bot and it has to be playing or paused\n~'
                    },
                    {
                        name: '`' + prefix + 'remaining`',
                        value: 'Retrieves som info on the song currently playing as well as the queue\n\n' +
                            '       **aliases:** `playing`, `left`, `queue`\n' +
                            '       **conditions:** you must be in the same voice channel as the bot and it has to be playing or paused\n~'
                    },
                    {
                        name: '`' + prefix + 'end`',
                        value: 'End playback\n\n' +
                            '       **aliases:** `stop`\n' +
                            '       **conditions:** you must be in the same voice channel as the bot and it has to be playing or paused\n~'
                    }
                ]
            }
        }
    }
    
}
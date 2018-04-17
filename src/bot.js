const { token } = require('../config.json');
const { prefix } = require('../settings.json');
const { ping } = require('./util.js');
const embeds = require('./embeds.js');
const Message = require('./message.js');
const Player = require('./playback.js');
const Queue = require('./queue.js');
const Fetcher = require('./fetch.js');
const Discord = require('discord.js');

const client = new Discord.Client();
const q = new Queue();
const f = new Fetcher(q);
const pb = new Player(client, q);

client.on('ready', () => {
    console.log('I\'m ready!');
    /*client.user.setPresence({ 
        status: 'idle', 
        game: { 
            name: `nothing | ${prefix}help` 
        }
    })*/
});

client.on('message', async message => {
    try {

        if (message.author.id === client.user.id) return;

        const args = message.content.trim().split(/ +/g);
        let command = args.shift().toLowerCase();
        const p = command[0];
        command = command.slice(prefix.length);

        // Figure out a way to catch flags...
        message = new Message(message);

        if (p !== prefix) return;

        console.log(args);
        console.log(command);

        switch (command) {

            case 'help':
            case 'h':
                // ...
                break;

            case 'ping':
            case 'latency':
            case 'measure':
                message.send(embeds.ping(client,
                    await ping(message)));
                break;

            case 'play':
            case 'song':
            case 's':
                const result = await f.get(args, message);
                if (!result) return;
                let queue_length;
                if (pb.playing) queue_length = pb.queueTime();
                q.enqueue(result, [ 'autoplay', 'shuffle' ]);
                if (!pb.playing)
                    return pb.play();
                    /*client.user.setPresence({
                        status: 'online',
                        game: {
                            name: `${song.title}\n
                            by ${song.artist}\n
                            suggested by ${song.message.author}`
                        }
                    });*/
                return message.send(embeds.queued(pb, result, 
                    queue_length));
                break;

            case 'pause':
            case 'p':
                // ...
                break;

            case 'unpause':
            case 'resume':
                // ...
                break;

            case 'remaining':
            case 'playing':
            case 'left':
            case 'next':
            case 'queue':
                // ...
                break;

            case 'skip':
                pb.skip(message);
                break;

            case 'replay':
                // ...
                break;

            case 'recent':
            case 'previous':
            case 'history':
                // ...
                break;

            case 'volume':
            case 'v':
                // ...
                break;

            case 'end':
            case 'stop':
                // ...
                break;

            case 'reload':
                q = new Queue();
                f = new Fetcher();
                pb = new Playback();
                // ...
                break;

        }

    } catch(error) {
        console.log(error);
        message.channel.send('A fatal error occured:', error);
    }
});

client.login(token);
const { token, self_id } = require('../config.json');
const { prefix } = require('../settings.json');
const { ping, setPresence, inVoice } = require('./util.js');
const embeds = require('./embeds.js');
const Message = require('./message.js');
const Player = require('./playback.js');
const Queue = require('./queue.js');
const Fetcher = require('./fetch.js');
const Discord = require('discord.js');

const client = new Discord.Client();
let q = new Queue();
let f = new Fetcher(q);
let pb = new Player(client, q);

client.on('ready', () => {
    console.log('I\'m ready!');
    setPresence(pb);
});

client.on('message', async message => {
    try {

        if (!message.content.startsWith(prefix) || 
        message.author.bot || message.channel.type !== 'text') 
            return;

        let params = message.content.trim().split(/ +/g);
        const command = params.shift().toLowerCase()
            .slice(prefix.length);
        const args = params.reduce((prev, elem, i) => {
            if (elem.startsWith('--')) {
                prev.push(elem.slice(2));
                params[i] = undefined;
            }
            return prev;
        }, []);
        params = params.filter(elem => elem != undefined);

        // Figure out a way to catch flags...
        message = new Message(message);

        console.log('command:', command);
        console.log('params:', params);
        console.log('args:', args);

        switch (command) {

            case 'help':
            case 'h':
                message.send('sent help!');
                message.author.send(embeds.help());
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
                // handle negative cases...
                if (!pb.playing && !message.obj.member.voiceChannel)
                    return message.send('you must be in a voice ' +
                    'channel in order to issue playback commands!');
                if (pb.playing && !inVoice(message.obj.member))
                    return message.send('you must be in the same ' +
                    'voice channel as me in order to issue ' +
                    'playback commands!');

                // fetch request and return if unsuccessful
                const result = await f.get(params, message);
                if (!result) return;

                // remember the current queue length for use in
                // queued embed
                let queue_length;
                if (pb.playing) queue_length = pb.queueTime();

                // enqueue fetched song(s)
                q.enqueue(result, args);

                // play the first song in queue if nothing is play-
                // ing, else notify the user that their song request
                // was queued
                if (!pb.playing)
                    return pb.play();
                message.send(embeds.queued(pb, result, 
                    queue_length));

                break;

            case 'pause':
            case 'p':
                pb.pause(message);
                break;

            case 'unpause':
            case 'resume':
            case 'up':
                pb.resume(message);
                break;

            case 'skip':
            case 'next':
                pb.skip(message);
                break;

            case 'volume':
            case 'vol':
                pb.setVolume(message, params[0]);
                break;

            case 'remaining':
            case 'playing':
            case 'left':
            case 'queue':
                pb.remaining(message);
                break;

            case 'end':
            case 'stop':
                pb.end(message);
                break;

            /** for version 1.1.0 */

            /*
            case 'replay':
                // replay history.pop(), if undefined replay current
                // song...
                break;
            */

            /*
            case 'recent':
            case 'previous':
            case 'history':
                // the last five songs played are...
                break;
            */

            /*
            case 'jump':
            case 'j':
                // jump a specific amount of seconds relative to
                // the progress of the song currently playing...
                break;
            */

            /*
            case 'jumpto':
            case 'jt':
                // jump independently of song progress...
                break;
            */

        }

    } catch(error) {
        console.log(error);
        message.channel.send('A fatal error occured:', error);
    }
});

client.on('voiceStateUpdate', member => {

    if (member.voiceChannel != undefined) {
        const map = member.voiceChannel.members;
        if (pb.playing && map.size == 1 && inVoice(member)) {
            // Disconnect from voice chat if no one's listening
            pb.terminate();
        }
    }

})

client.login(token);
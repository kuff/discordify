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

    if (!message.content.startsWith(prefix) || 
    message.author.bot || message.channel.type !== 'text') 
        return;

    let params = message.content.trim().split(/ +/g);
    const command = params.shift().toLowerCase()
        .slice(prefix.length);
    const args = params.reduce((prev, elem, i) => {
        // this can probably be improved
        if (elem.startsWith('-')) {
            prev.push(elem.slice(1));
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
            await message.author.send(embeds.help());
            message.send('sent help!');
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
            if (!params[0]) return message.send('you must ' +
                'provide something to play!');
            if (!pb.playing && !message.obj.member.voiceChannel)
                return message.send('you must be in a voice ' +
                'channel in order to issue playback commands!');
            if (pb.playing && !inVoice(message.obj.member))
                return message.send('you must be in the same ' +
                'voice channel as me in order to issue ' +
                'playback commands!');

            // fetch request and return if unsuccessful
            const result = await f.get(params, message);
            if (!result) return console.log('song: found nothing');
            console.log('song:', result.link);

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
            if (!pb.playing) return message.send(
                'nothing is playing!');
            if (!inVoice(message.obj.member)) return message.send(
                'you must be in the same voice channel as me in ' +
                'order to use `' + prefix + 'pause`!');
            if (pb.dispatcher.paused) return message.send('playback' +
                ' is already paused!');
            if (pb.guard) return message.send('another playback ' +
                'command is being executed!');
            pb.pause();
            break;

        case 'unpause':
        case 'resume':
        case 'up':
            if (!pb.playing) return message.send(
                'nothing is playing!');
            if (!inVoice(message.obj.member)) return message.send(
                'you must be in the same voice channel as me in ' +
                'order to use `' + prefix + 'unpause`!');
            if (!pb.dispatcher.paused) return message.send(
                'playback is not paused!');
            if (pb.guard)
                return message.send('another playback command is ' +
                    'being executed!');
            pb.resume();
            break;

        case 'skip':
        case 'next':
            if (!pb.playing) return message.send(
                'nothing is playing!');
            if (!inVoice(message.obj.member)) return message.send(
                'you must be in the same voice channel as me in ' +
                'order to use `' + prefix + 'skip`!');
            if (pb.guard)
                return message.send('another playback command is ' +
                    'being executed!');
            pb.skip(message);
            break;

        case 'volume':
        case 'vol':
            if (!pb.playing) return message.send(
                'nothing is playing!');
            if (!inVoice(message.obj.member)) return message.send(
                'you must be in the same voice channel as me in ' +
                'order to use `' + prefix + 'vol`!');
            let val = params[0];
            if (val && isNaN(val)) return message.send('provided' +
                ' value must be a number!');
            val = parseInt(val)
            if (val && (!Number.isInteger(val) ||
                (val < 1 || val > 100)))
                return message.send('provided value must be ' +
                    'an integer between 1 and 100!');
            if (pb.guard)
                return message.send('another playback command ' +
                    'is being executed!');
            pb.setVolume(message, val);
            break;

        case 'remaining':
        case 'playing':
        case 'left':
        case 'queue':
            if (!pb.playing) return message.send(
                'nothing is playing!');
            pb.remaining(message);
            break;

        case 'end':
        case 'stop':
            if (!pb.playing) return message.send(
                'nothing is playing!');
            if (!inVoice(message.obj.member)) return message.send(
                'you must be in the same voice channel as me in ' +
                'order to use `' + prefix + 'stop`!');
            if (pb.guard)
                return message.send('another playback command is ' +
                    'being executed!');
            pb.end();
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
        case 'history':
        case 'previous':
        case 'prev':
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
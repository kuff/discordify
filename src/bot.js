const { token, self_id } = require('../config.json');
const { prefix } = require('../settings.json');
const { ping, setPresence, inVoice, enqueue } = require('./util.js');
const embeds = require('./embeds.js');
const Message = require('./message.js');
const Player = require('./playback.js');
const Queue = require('./queue.js');
const { isUri } = require('valid-url');
const Fetcher = require('./fetch.js');
const Discord = require('discord.js');

const client = new Discord.Client();
let q = new Queue();
let f = new Fetcher(q);
let pb = new Player(client, q);

client.on('ready', () => {
    console.log(`${client.user.username}#${client.user
        .discriminator} is up and running!`);
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
            await message.author.send(embeds.help(message));
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
                'specify something to play, see `' + prefix + 
                '` for more!');
            if (pb.playing && !inVoice(message.obj.member))
                return message.send('you must be in the same ' +
                    'voice channel as me in order to issue ' +
                    'playback commands!');
            if (!pb.playing && !message.obj.member.voiceChannel)
                return message.send('you must be in a voice ' +
                    'channel in order to issue playback commands!');

            const result = await f.get(params, message);
            enqueue(pb, q, result, message, args, embeds);
            break;

        case 'playit':
        case 'pi':
            if (pb.playing && !inVoice(message.obj.member))
                return message.send('you must be in the same ' +
                    'voice channel as me in order to issue ' +
                    'playback commands!');
            if (!pb.playing && !message.obj.member.voiceChannel)
                return message.send('you must be in a voice ' +
                    'channel in order to issue playback commands!');

            const messages = await message.obj.channel.fetchMessages({ limit: 2 });
            query_message = messages.last();
            const new_params = query_message.content.trim().split(/ +/g);
            const url = new_params.find(elem => isUri(elem));

            let fetched;
            if (url) fetched = await f.get([url], message);
            else fetched = await f.get(new_params, message);

            enqueue(pb, q, fetched, message, args, embeds);
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
        case 'start':
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
                'order to use `' + prefix + 'volume`!');
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
            pb.terminate();
            break;

        case 'replay':
        case 'rp':
            if (!inVoice(message.obj.member) && pb.playing) 
                return message.send('you must be in the same voice'
                + ' channel as me in order to use `' + prefix 
                + 'replay`!');
            if (pb.guard)
                return message.send('another playback command is ' +
                    'being executed!');
            pb.replay(message, args);
            break;
        
        case 'loop':
            if (!pb.playing) return message.send(
                'nothing is playing!');
            if (!inVoice(message.obj.member)) return message.send(
                'you must be in the same voice channel as me in ' +
                'order to use `' + prefix + 'loop`!');
            if (pb.guard)
                return message.send('another playback command is ' +
                    'being executed!');
            pb.addFlag('loop', message);
            break;
        
        case 'autoplay':
            if (!pb.playing) return message.send(
                'nothing is playing!');
            if (!inVoice(message.obj.member)) return message.send(
                'you must be in the same voice channel as me in ' +
                'order to use `' + prefix + 'autoplay`!');
            if (pb.guard)
                return message.send('another playback command is ' +
                    'being executed!');
            pb.addFlag('autoplay', message, true);
            break;

        /** for version 1.3.0 */

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
        // get all connected members
        let members = member.voiceChannel.members;
        // ignore bot members
        members = members.filter(elem => !elem.user.bot || 
            elem.id === self_id);
        // disconnect from voice chat if no one's listening
        if (pb.playing && members.size == 1 && inVoice(member)) {
            pb.terminate();
        }
    }

});

client.login(token).then(() => { // sign in as bot user

    const guild = client.guilds.first();
    const voiceChannel = guild.me.voiceChannel;
    // if the bot is connected to a voice channel right after 
    // booting up, it means it crashed and rebooted, which we will
    // then inform the user
    if (voiceChannel) {
        // disconnect from the voice channel
        voiceChannel.join().then(connection => 
            connection.disconnect());
        // find suitible text channels, to inform the user(s) 
        // through, meaning text channels where the bot has read-
        // and write permissions
        const textChannels = guild.channels
            .filter(channel => channel.permissionsFor(guild.me)
                .has('READ_MESSAGES') 
                && channel.permissionsFor(guild.me)
                    .has('SEND_MESSAGES')
                && channel.type === 'text');
        // finally, send the message to the first valid channel
        textChannels.first().send('Oops, It would appear ' +
            'Discordify crashed during playback! (And rebooted ' +
            'successfully)');
    }
    
});
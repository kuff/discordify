'use strict'

const { self_id } = require('../config.json');
const { 
    default_volume, audio_passes, message_update_interval
} = require('../settings.json');
const { formatTime, setPresence, inVoice } = require('./util.js');
const embeds = require('./embeds.js');
const Message = require('./message.js');

module.exports = class Playback {
    
    constructor(client, queue) {
        this.client = client;
        this.queue = queue;
        this.playing = undefined; // should contain song when playing
        this.volume = default_volume;
        this.guard = undefined; // the method guard
    }

    async play(skipped = false) {
        this.guard = this.play;

        const song = await this.queue.dequeue(skipped);
        if (!song) {
            //if (!skipped) this.playing.message.delete();
            return this.terminate();
        }
        
        const first = skipped ? true : this.playing === undefined;
        this.playing = song;

        if (!this.connection) {
            const voiceChannel = song.message.author.lastMessage
                .member.voiceChannel;
            if (!voiceChannel) {
                song.message.send('your request will not be played' +
                    ' because you disconnected from the voice ' +
                    'channel!');
                this.playing = undefined;
                this.queue.clear();
                this.guard = null;
                return;
            }
            this.connection = await voiceChannel.join();
        }
        
        this.dispatcher = this.connection.playStream(
            await song.play(this.connection.channel.bitrate), 
            { 
                volume: this.volume, 
                passes: audio_passes, 
                bitrate: 'auto' 
            }
        );
        this.connection.player.streamingData.pausedTime = 0;

        this.dispatcher.on('debug', message => console.log(
            'Stream dispatcher:', message
        ));

        this.dispatcher.on('start', async () => {
            if (!first && song.message.author.id != self_id) 
                await song.message.sendNew(embeds.playing(this));
            else await song.message.send(embeds.playing(this));
            setPresence(this);
            this.guard = undefined;
        });

        this.dispatcher.on('end', async reason => {
            if (!this.playing) return;
            this.guard = this.play;

            const method = async () => {
                
                if (this.connection.speaking === true) {
                    setTimeout(method, 50);
                    return;
                }
    
                this.dispatcher = null;
    
                const prev = this.queue.peek(this.queue.history);
                if (prev && this.queue.size() == 0 && prev.flags
                .indexOf('autoplay') != -1) {
                    if ((prev.flags.indexOf('loop') != -1 && 
                    reason === 'user') || prev.flags
                    .indexOf('loop') == -1) {
                        await prev.message.sendNew('autoplaying...');
                        prev.message = new Message(prev.message.obj);
                    }
                }
    
                this.play(reason === 'user');
                //console.log('reason:', reason);

            }
            method();
        });

        this.dispatcher.on('error', async error => {
            this.guard = this.play;
            await song.message.send(`An error occured during 
                playback: ${error}`);
            this.play();
        });
    }

    pause(message) {
        if (!this.playing) return message.send(
            'nothing is playing!');
        if (this.dispatcher.paused) return message.send('playback' +
            ' is already paused!');
        if (this.guard) return message.send('another playback ' +
            'command is being executed!');
        this.dispatcher.pause();
    }

    async resume(message) {
        if (!this.playing) return message.send(
            'nothing is playing!');
        if (!this.dispatcher.paused) return message.send(
            'playback is not paused!');
        if (this.guard) 
            return message.send('another playback command is ' +
            'being executed!');
        this.guard = this.resume;
        await this.dispatcher.resume();
        this.guard = undefined;
    }
    
    async skip(message/*, amount = 1*/) {
        // other guards here...
        if (this.guard) 
            return message.send('another playback command is ' +
            'being executed!');
        this.guard = this.skip;

        //this.playing.message.delete();

        if (/*amount <= this.queue.size() &&*/ 
        this.queue.size() > 0) {
            await message.send('skipping...');
            this.queue.queue[0].message.obj = message.obj;
            /*const promises = [];
            for (let i = 1; i < amount; i++)
                promises.push(this.queue.dequeue(true));
            await Promise.all(promises); // marginal performance*/
        }                                // gain if any at all
        this.dispatcher.end();
    }

    setVolume(message, val) {
        if (message) {
            if (!this.playing) return message.send(
                'nothing is playing!');
            if (val && isNaN(val)) return message.send('provided' +
                ' value must be a number!');
            val = parseInt(val)
            if (val && !Number.isInteger(val) || 
            (val < 1 || val > 100))
                return message.send('provided value must be ' +
                    'an integer between 1 and 100!');
            if (this.guard) 
                return message.send('another playback command ' +
                'is being executed!');
        }
        if (val == this.volume) return;
        if (!val) {
            const vol = Math.round((this.volume / 
                (default_volume * 4)) * 100);
            if (message) return message.send('playing at ' +
                `${vol}% volume!`);
            return vol;
        }
        this.volume = (val * (default_volume * 4)) / 100;
        this.dispatcher.setVolume(this.volume);
        setPresence(this);
    }

    end(message) {
        // handle negative cases
        if (!this.playing) return message.send(
            'nothing is playing!');
        if (this.guard) 
            return message.send('another playback command is ' +
            'being executed!');
        // execute method body
        this.terminate();
    }

    terminate() {
        this.playing = undefined;
        this.connection.disconnect();
        this.connection = null;
        this.queue.clear();
        this.paused = false;
        this.volume = default_volume;
        setPresence(this);
        this.guard = null;
    }

    remaining(message) {
        if (!this.playing) return message.send(
            'nothing is playing!');
        message.send(embeds.remaining(this));
    }

    queueTime(queue = this.queue.queue) {
        // add up total queue time
        let containsLivestream = queue === this.queue.queue ? 
            this.playing.duration == 0 : false;
        let total = queue.reduce((time, elem) => {
            if (elem.duration == 0) containsLivestream = true;
            return time += elem.duration;
        }, 0);
        // add remaining duration of song currently playing
        if (queue === this.queue.queue)
            total += Math.round(this.playing.duration -
                (this.dispatcher.time / 1000));
        // finally, return result
        if (containsLivestream)
            return '∞';
        return formatTime(total);
    }

    /** for version 1.1.0 */

    /*
    replay(message) {
        // handle negative cases
        if (this.guard) return message.send('another playback ' +
            'command is being executed!');
        // execute method body
        // ...
    }
    */
    
    /*
    jump(message, seconds) {
        // ...
    }
    */

    /*
    jumpTo(message, seconds) {
        // ...
    }
    */

}
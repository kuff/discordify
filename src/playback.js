'use strict'

const { 
    default_volume, audio_passes, message_update_interval
} = require('../settings.json');
const { formatTime } = require('./util.js');
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
        //console.log(song);
        
        const first = skipped ? true : this.playing === undefined;
        this.playing = song;

        if (!this.connection) this.connection = await song.message
            .author.lastMessage.member.voiceChannel.join();
            
        this.dispatcher = this.connection.playStream(
            await song.play(), { 
                volume: this.volume, 
                passes: audio_passes, 
                bitrate: 'auto' 
            }
        );
        this.connection.player.streamingData.pausedTime = 0;

        this.dispatcher.on('start', async () => {
            if (!first) await song.message.sendNew(
                embeds.playing(this));
            else await song.message.send(embeds.playing(this));
            this.guard = undefined;

            /*while (this.playing === song) {
                await new Promise(resolve => setTimeout(
                async () => {
                    const embed = embeds.playing(this);
                    if (this.playing !== song) return resolve();
                    await song.message.send(embed);
                    resolve();
                }, message_update_interval));
            }*/
        });

        this.dispatcher.on('end', reason => {
            if (!this.playing) return;
            this.guard = this.play;
            this.dispatcher.end();
            this.dispatcher = null;
            this.play(reason === 'user');
            //console.log('reason:', reason);
        });

        this.dispatcher.on('error', async error => {
            this.guard = this.play;
            await song.message.send(`Error in stream dispatcher: 
                ${error}`);
            this.play();
        });
    }

    pause(message, seconds) {
        if (this.guard) return false;
        // ...
    }

    resume(message) {
        if (this.guard) return false;
        // ...
    }

    remaining(message) {
        // ...
    }
    
    async skip(message, amount = 1) {
        // other guards here...
        if (this.guard) return message.send('another playback ' +
            'command is being executed!');
        this.guard = this.skip;

        //this.playing.message.delete();

        if (this.queue.size() == 0 && this.queue.peek(
            this.queue.history).flags.indexOf('autoplay' != -1)) {
                await message.send('autoplaying...');
                message = new Message(message.obj);
                this.queue.history[this.queue.history.length - 1]
                    .message = message;
            }
        else if (amount < this.queue.size() && 
        this.queue.size() > 0) {
            await message.send('skipping...');
            this.queue.queue[0].message.obj = message.obj;
            const promises = [];
            for (let i = 1; i < amount; i++)
                promises.push(this.queue.dequeue(true));
            await Promise.all(promises); // marginal performance
        }                                // gain if any at all
        this.dispatcher.end();
    }

    replay(message) {
        if (this.guard) return false;
        // ...
    }
    
    /*jump(message, seconds) {
        // ...
    }*/

    volume(message, val) {
        if (this.guard) return false;
        // ...
    }

    terminate() {
        this.playing = false;
        this.connection.disconnect();
        this.connection = null;
        this.queue.clear();
        this.paused = false;
        this.volume = default_volume;
    }

    queueTime(queue = this.queue.queue) {
        // add up total queue time
        let containsPlaylist = false;
        let total = queue.reduce((time, elem) => {
            if (elem.duration == 0) containsPlaylist = true;
            return time += elem.duration;
        }, 0);
        // add remaining duration of song currently playing
        if (queue === this.queue.queue)
            total += Math.round(this.playing.duration - 
                (this.dispatcher.time / 1000));
        // finally, return result
        if (containsPlaylist)
            return '>' + formatTime(total);
        return formatTime(total);
    }

}
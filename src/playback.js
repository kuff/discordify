'use strict';

const { self_id } = require('../config.json');
const { default_volume, audio_passes} = require('../settings.json');
const { formatTime, setPresence } = require('./util.js');
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
            const user = song.message.author;
            const voiceChannel = user.lastMessage.member
                .voiceChannel;
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
        
        song.play(this.connection.channel.bitrate).then(stream => {
            this.stream = stream;
            this.dispatcher = this.connection.playStream(
                this.stream, 
                { 
                    volume: this.volume, 
                    passes: audio_passes, 
                    bitrate: 'auto' 
                }
            );
            this.connection.player.streamingData.pausedTime = 0;
    
            this.dispatcher.on('start', async () => {
                console.log('Now playing:', song.link);
                if (!first && song.message.author.id !== self_id)
                    await song.message.sendNew(embeds.playing(this));
                else await song.message.send(embeds.playing(this));
                setPresence(this);
                this.guard = undefined;
            });
    
            this.dispatcher.on('end', async reason => {
                if (!this.playing) return;
                this.guard = this.play;
    
                // logic for autoplaying message
                const prev = this.queue.peek(this.queue.history);
                if (prev && this.queue.size() === 0 && prev.flags
                .indexOf('autoplay') !== -1) {
                    if ((prev.flags.indexOf('loop') !== -1 &&
                    reason === 'user') || prev.flags
                    .indexOf('loop') === -1) {
                        await prev.message.sendNew('autoplaying...');
                        prev.message = new Message(prev.message.obj);
                    }
                }
    
                this.dispatcher = null;
                this.play(reason === 'user')
                    .catch(error => song.message.send('an error occurred'
                        + ' while attempting to initiate playback: ' + error));
                console.log('Dispatcher ended by:', reason);
            });
    
            this.dispatcher.on('error', async error => {
                this.guard = this.play;
                await this.playing.message.sendNew(
                    `An error occurred during playback: ${error}`);
                this.dispatcher.end();
            });
        })
        .catch(error => {
            console.log('Error in playback stream:', error);
            this.playing.message.send('an error occurred while ' +
                'attempting to play ' + '`' + this.playing.title + '`!'
                + ' This song might be age restricted or copyright protected!'
                + (this.queue.size() > 0 
                ? ' Playing next item in queue...'
                : ''));
            this.play(true)
                .catch(error => song.message.send('an error occurred'
                    + ' while attempting to initiate playback: ' + error));
        });
        
    }

    pause() {
        this.dispatcher.pause();
    }

    async resume() {
        this.guard = this.resume;
        await this.dispatcher.resume();
        this.guard = undefined;
    }
    
    async skip(message) {

        this.guard = this.skip;

        //this.playing.message.delete();
        this.stream.destroy();

        if (message && this.queue.size() > 0) {
            await message.send('skipping...');
            this.queue.queue[0].message.obj = message.obj;
        }
        this.dispatcher.end();

    }

    async replay(message, args) {

        let item = this.queue.history.pop();

        if (this.playing) {
            if (this.dispatcher.time < 6000) {
                await message.send('replaying previous item...');
                item = this.queue.history.pop();
            }
            else await message.send('replaying current item...');
        }
        else await message.send('replaying previous item...');
        if (!item) return message.send('I don\'t remember what '
            + 'played before this!');
        
        args.push('next');
        this.queue.enqueue(item, args);
        this.queue.queue[0].message = message;

        if (this.playing) this.skip()
            .catch(error => message.send('an error occurred'
                + ' while skipping tracks: ' + error));
        else this.play()
            .catch(error => message.send('an error occurred'
                + ' while attempting to initiate playback: ' + error));

    }

    addFlag(flag, message, apply_on_queue = false) {
        const item = this.queue.history[this.queue.history
            .length - 1];
        if (item.flags.indexOf(flag) !== -1) return message.send(
            'item already has the `' + flag + '` attribute!');
        if (apply_on_queue) this.queue.queue.forEach(elem => 
            elem.flags.push(flag));
        item.flags.push(flag);
        message.send('added `' + flag + '` functionality to '
            + 'the queue!');
    }

    setVolume(message, val) {
        if (val === this.volume) return;
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

    terminate() {
        this.playing = undefined;
        this.connection.disconnect();
        this.connection = null;
        this.dispatcher = null;
        this.stream = null;
        this.queue.clear();
        this.volume = default_volume;
        setPresence(this);
        this.guard = null;
    }

    remaining(message) {
        message.send(embeds.remaining(this));
    }

    queueTime(queue = this.queue.queue) {

        if (!this.playing) return '0:00';

        // add up total queue time
        let containsLivestream = queue === this.queue.queue ? 
            this.playing.duration === 0 : false;
        let total = queue.reduce((time, elem) => { // use arr.sum()?
            if (!elem) return 0;
            if (elem.duration === 0) containsLivestream = true;
            return time += elem.duration;
        }, 0);

        // add remaining duration of song currently playing
        if (this.dispatcher && queue === this.queue.queue) {
            const time = this.dispatcher.time;
            if (this.playing.duration === 0 || this.playing.flags
            .indexOf('loop') !== -1) return '∞';
            total += Math.round(this.playing.duration -
                (time / 1000));
        }

        // finally, return result
        if (containsLivestream) return '∞';
        return formatTime(total);

    }

}
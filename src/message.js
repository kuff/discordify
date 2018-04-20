'use strict'

const { self_id } = require('../config.json');
const embeds = require('./embeds.js');

module.exports = class Message {

    constructor(message) {
        this.obj = message;
        this.author = message.author;
    }

    async send(message) {
        if (this.obj.author.id == self_id) {
            if (message.embed) {
                this.obj = await this.obj
                    .edit(message);
            } else {
                this.obj = await this.obj
                    .edit(`${this.author}, ${message}`);
            }
        } else {
            if (message.embed) {
                this.obj = await this.obj.channel.send(message);
            } else {
                this.obj = await this.obj.reply(message);
            }
        }
    }

    async sendNew(message, delete_current_message = false) {
        const channel = this.obj.channel;
        if (delete_current_message)
            await this.obj.delete();
        if (message.embed) {
            this.obj = await channel.send(message);
        } else {
            if (this.author.id == self_id) this.obj = await channel
                .send(message);
            else this.obj = await channel.send(this.author + ', ' +
                message);
        }
    }

    async delete() {
        await this.obj.delete();
    }

}
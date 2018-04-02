const { self_id } = require('../config.json');
const youtube = require('./youtube.js');
const { URL, parse } = require('url');
const { isUri } = require('valid-url');

module.exports = class Fetch {

    constructor() {
        this.queue = []; // the processing queue, determining the 
    }                    // order in which requests are processed

    async get(query, message, args) {
        return new Promise(async (resolve, reject) => {
            // notify the user that their request is not currently
            // being processed if another process is already running
            if (this.queue.length > 0) {
                await message.send('waiting for another process ' +
                    'to finish...');
            }
            // add the request object to the processing queue
            this.queue.push(this.search({
                q: query,
                message: message,
                args: args
            }));
            // await fetching and tell the user if nothing was found
            const process = this.queue[this.queue.length - 1];
            process.then(async output => {
                if (!output || output.length == 0) {
                    await message.send('found nothing!');
                    return resolve(undefined);
                }
                // finally, return the fetched results
                return resolve(output);
            })
            .catch(async () => {
                await message.send('found nothing!');
                return resolve(undefined);
            });
        });
    }

    async search(request) {
        // wait for previous processes in the queue to finish
        if (this.queue.length > 0)
            await this.queue[this.queue.length - 1];
        // inform the user that their request is now being processed
        await request.message.send('processing...');
        // begin appropriate fetching procedure
        if (isUri(request.q)) return await this.getFromUrl(request);
        return await this.getFromQuery(request);

    }

    async getFromUrl(request) {
        // parse the url and react on relevant hostnames
        const url = parse(request.q);
        switch (url.hostname) {
            case 'www.youtube.com':
                // look for relevant link attributes
                const url = new URL(request.q);
                const id = url.searchParams.get('v');
                const list_id = url.searchParams.get('list');
                if (list_id) {
                    return await youtube.getPlaylistById(list_id, 
                        request.message);
                }
                else if (id) {
                    return await youtube.getById(id, request.message);
                }
                break;
            // for future sources...
        }
        return undefined; // found nothing, returning undefined
    }

    async getFromQuery() {
        // ...
    }
    
}
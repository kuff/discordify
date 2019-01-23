const youtube = require('./youtube.js');
const { URL, parse } = require('url');
const { isUri } = require('valid-url');

module.exports = class Fetch {

    constructor() {
        this.queue = []; // the processing queue, determining the 
    }                    // order in which requests are processed

    async get(query, message, args) {
        return new Promise(async (resolve, reject) => {
            let query_string = '';
            query.map(elem => query_string += elem + ',');
            query = query_string.slice(0, query_string.length - 1);
            // notify the user that their request is not currently
            // being processed if another process is already running
            if (this.queue.length > 0) {
                await message.send('waiting for another process ' +
                    'to finish...');
            }
            // add the request object to the processing queue
            this.queue.push(this.search(query, message, args));
            // await fetching and tell the user if nothing was found
            const process = this.queue[this.queue.length - 1];
            process.then(async output => {
                if (process === this.queue[this.queue.length - 1]) 
                    this.queue = [];
                if (!output || output.length == 0) {
                    await message.send('found nothing!');
                    return resolve(undefined);
                }
                // finally, return the fetched results
                return resolve(output);
            })
            .catch(async error => {
                if (process === this.queue[this.queue.length - 1])
                    this.queue = [];
                await message.send(error);
                return resolve(undefined);
            });
        });
    }

    async search(query, message, args) {
        // wait for previous processes in the queue to finish
        if (this.queue.length > 0)
            await this.queue[this.queue.length - 1];
        // inform the user that their request is now being processed
        await message.send('processing...');
        // begin appropriate fetching procedure
        if (isUri(query)) return await this.getFromUrl(query, 
            message, args);
        return await this.getFromQuery(query, message, args);
    }

    async getFromUrl(query, message, args) {
        // parse the url and react on relevant hostnames
        const url = parse(query);
        switch (url.hostname) {
            case 'youtu.be':
            case 'www.youtube.com':
                // look for relevant link attributes
                const url = new URL(query);
                var id = url.searchParams.get('v');
                if (!id) {
                    id = url.pathname;
                    if (id) id = id.substr(1);
                }
                const list_id = url.searchParams.get('list');
                if (list_id) {
                    // attempt to fetch video playlist if a 
                    // playlist id is given
                    const result = await youtube.getPlaylistById(
                        list_id, message);
                    if (result && result.length > 0)
                        // if successful, add the playlist id to
                        // the video urls for reference when clicked
                        result.forEach(elem =>
                            elem.link += `&list=${list_id}`);
                    if (!result && id) {
                        // if playlist fetch fails and a video id is
                        // available, attempt to fetch that instead
                        await message.send('attempting different parse...');
                        return await youtube.getById(id, message);
                    }
                    return result;
                }
                else if (id) {
                    return await youtube.getById(id, message);
                }
                break;
            // for future sources...
        }
        return undefined; // found nothing, returning undefined
    }

    async getFromQuery(query, message, args) {
        // args become relevant with multiple audio sources...
        return await youtube.search(query, message);
    }
    
}
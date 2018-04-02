const { youtube_api_key } = require('../config.json');
const { getById, getPlaylistById } = require('../src/youtube.js');
const Fetcher = require('../src/fetch.js');
const Message = require('../src/message.js');
const YouTube = require('youtube-node');

id = '5eZyspecXJE';
list_id = 'PLEQoAV22e4i1v8WG1ZzyW6Jmh-P7oaRBB';

const f = new Fetcher();

const messageMock = {
    reply: () =>
        new Promise((resolve, reject) => {
            return resolve(messageMock)
        }),
    edit: () =>
        new Promise((resolve, reject) => {
            return resolve(messageMock)
        }),
    author: {
        id: '123'
    }
}
const message = new Message(messageMock);

it('Correctly Fetches Single YouTube Videos From Links', 
async done => {
    const test = await f.get(
        `https://www.youtube.com/watch?v=${id}`, message)
    const expected = await getById(id);
    test.message = undefined;
    expect(JSON.stringify(test))
        .toEqual(JSON.stringify(expected));
    done();
});

it('Correctly Fetches YouTube Playlists From Links', async done => {
    const test = await f.get(
        `https://www.youtube.com/watch?v=${id}&list=${list_id}`, 
        message);
    const set = new Set();
    test.forEach(elem => set.add(elem.id));
    const expected = await getPlaylistById(list_id,
        message);
    expected.forEach(elem => set.add(elem.id));
    expect(set.size)
        .toEqual((test.length + expected.length) / 2);
    done();
});

it('Correctly Queues Requests', async done => {
    const test = f.get(
        `https://www.youtube.com/watch?v=${id}&list=${list_id}`, 
        message);
    setTimeout(async () => {
        const test2 = f.get(
            `https://www.youtube.com/watch?v=${id}`, 
            message);
        await test;
        expect(test2)
            .not.toHaveProperty('id');
        test2.then(result => {
            expect(result)
                .toHaveProperty('id');
            expect(result.id)
                .toEqual(id);
            done();
        });
    }, 100);
});
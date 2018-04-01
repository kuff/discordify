const { youtube_api_key } = require('../config.json');
const { getById, getPlaylistById } = require('../src/youtube.js');
const Fetcher = require('../src/fetch.js');
const YouTube = require('youtube-node');

id = '5eZyspecXJE';
list_id = 'PLEQoAV22e4i1v8WG1ZzyW6Jmh-P7oaRBB';

const f = new Fetcher();

const messageMockBefore = {
    reply: () =>
        new Promise((resolve, reject) => {
            return resolve('replied!')
        }),
    edit: () =>
        new Promise((resolve, reject) => {
            return resolve('edited!')
        }),
    author: {
        id: '123'
    }
}

const messageMockAfter = {
    obj: {
        reply: () => 
            new Promise((resolve, reject) => {
                return resolve('replied!')
            }),
        edit: () =>
            new Promise((resolve, reject) => {
                return resolve('edited!')
            }),
        author: {
            id: '123'
        }
    },
    author: {
        id: '123'
    }
}

it('Correctly Fetches Single YouTube Videos From Links', 
async done => {
    expect(JSON.stringify(await f.get(
        `https://youtube.com/watch?v=${id}`, {}, messageMockBefore)))
        .toEqual(JSON.stringify(await getById(id, 
            messageMockAfter)));
    done();
});

it('Correctly Fetches YouTube Playlists From Links', async done => {
    const test = await f.get(
        `https://youtube.com/watch?v=${id}&list=${list_id}`, {},
        messageMockBefore);
    const set = new Set();
    test.forEach(elem => set.add(elem.id));
    const expected = await getPlaylistById(list_id,
        messageMockAfter);
    expected.forEach(elem => set.add(elem.id));
    expect(set.size)
        .toEqual((test.length + expected.length) / 2);
    done();
});

it('Correctly Queues Requests', async done => {
    const test = f.get(
        `https://youtube.com/watch?v=${id}&list=${list_id}`, {},
        messageMockBefore);
    setTimeout(async () => {
        const test2 = f.get(
            `https://youtube.com/watch?v=${id}`, {},
            messageMockBefore);
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
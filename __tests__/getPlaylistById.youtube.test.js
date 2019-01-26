const { youtube_api_key } = require('../config.json');
const { getPlaylistById } = require('../src/youtube.js');
const YouTube = require('youtube-node');

yt = new YouTube();
yt.setKey(youtube_api_key);

const messageMock = {
    send: () => messageMock
}

jest.setTimeout(10000);

it('Return Playlists With Less Than 50 Entries', async done => {
    const list_id = 'PLxQTcoJgTJsQ3DZUj6isaGuwGOY3Xp-p_'; // 16 entries at the time of writing
    yt.getPlayListsItemsById(list_id, 1, async (error, result) => {

        expect(error)
            .toEqual(null);

        const test = await getPlaylistById(list_id, messageMock);
        const set = new Set();
        test.forEach(elem => set.add(elem));

        expect(set.size).toEqual(result.pageInfo.totalResults);
        expect(set.length).toEqual(result.pageInfo.totalResults);

        done();

    });
    done();
});

it('Return Playlists With More Than 50 Entries', async done => {
    const list_id = 'PLGdEbnOoiEOOaFFYKh3A66wOUlrHUwzTs'; // 191 entries at the time of writing
    yt.getPlayListsItemsById(list_id, 1, async (error, result) => {

        expect(error)
            .toEqual(null);

        const test = await getPlaylistById(list_id, messageMock);
        const set = new Set();
        test.forEach(elem => set.add(elem));

        expect(set.size).toEqual(result.pageInfo.totalResults);
        expect(set.length).toEqual(result.pageInfo.totalResults);

        done();

    });
    done();
});

it('Returns Undefined If Provided With Invalid Playlist Id', 
async done => {
    expect(await getPlaylistById('invalid-id', messageMock))
        .toEqual(undefined);
    done();
});

it('Returns Undefined When Provided Playlist With Zero Entries',
async done => {
    const list_id = 'PLxQTcoJgTJsRHp266JneGvgYQmD3uty0z';
    expect(await getPlaylistById(list_id, messageMock))
        .toEqual(undefined);
    done();
});
const { youtube_api_key } = require('../config.json');
const { getById, getPlaylistById } = require('../src/youtube.js');
const YouTube = require('youtube-node');

list_id = 'PLEQoAV22e4i1v8WG1ZzyW6Jmh-P7oaRBB';
yt = new YouTube();
yt.setKey(youtube_api_key);

it('Returns The Correct Number Of Unique Elements Without Erroring', 
async done => {
    yt.getPlayListsItemsById(list_id, 1, async (error, result) => {
        expect(error)
            .toEqual(null);
        const test = await getPlaylistById(list_id);
        /*const test2 = test.map(elem => elem.title);
        console.log(test2.sort());*/
        const set = new Set();
        test.forEach(elem => set.add(elem));
        expect(set.size)
            .toEqual(result.pageInfo.totalResults);
        expect(test.length)
            .toEqual(result.pageInfo.totalResults);
        done();
    });
});

it('Returns Undefined If Provided With Invalid Playlist Id', 
async done => {
    expect(await getPlaylistById('invalid-id'))
        .toEqual(undefined);
    done();
});
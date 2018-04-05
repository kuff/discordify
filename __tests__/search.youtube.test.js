const { search, getById, getPlaylistById } = 
    require('../src/youtube.js');

const messageMock = {
    send: () => messageMock
};

const video_query = 'never gonna give you up';
const playlist_query = 'important videos playlist';
const bad_query = 'apsodufhjqoierfhqoiwefljcnwe1480923fuwhcnqliw'

it('Fetches Videos', async done => {
    expect(await search(video_query, messageMock))
        .toEqual(await getById('dQw4w9WgXcQ', messageMock))
    done();
});

jest.setTimeout(10000);
it('Fetches Playlists', async done => {
    const test = search(playlist_query, messageMock);
    const correct = getPlaylistById(
        'PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo', messageMock);
    await Promise.all([test, correct]);
    expect(test)
        .toEqual(correct);
    done();
});

it('Returns Undefined If Search Comes Up Empty', async done => {
    expect(await search(bad_query, messageMock))
        .toEqual(undefined);
    done();
});
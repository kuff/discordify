const { youtube_api_key } = require('../config.json');
const { memory_size } = require('../settings.json');
const { Song, getById } = require('../src/youtube.js');
const YouTube = require('youtube-node');
const stream = require('stream');

const YouTubeSong = Song;

id = '5eZyspecXJE';
yt = new YouTube();
yt.setKey(youtube_api_key);
input = '';
ids = [];

function relatedRaw() {
    return new Promise((resolve, reject) => {
        yt.related(id, memory_size + 5, (error, result) => {
            if (error) return reject(error);
            return resolve(result.items.reduce((cum, current) => {
                cum.push(current.id.videoId);
                return cum;
            }, []));
        });
    });
}

beforeAll(async done => {
    input = await getById(id);
    ids = await relatedRaw()
    done()
});

it('Initializes', () => {
    const song = new YouTubeSong(input);
    expect(song)
        .toEqual(input);
});

it('Plays', async done => {
    const song = new YouTubeSong(input);
    const song_stream = await song.play();
    expect(song_stream)
        .toBeInstanceOf(stream.Readable);
    song_stream.on('data', chunk => {
        expect(chunk.length).toBeGreaterThan(0);
        done();
    });
});

it('Does Related Search With No History', done => {
    const song = new YouTubeSong(input);
    song.related().then(result => {
        expect(result.id)
            .not.toEqual(id);
        getById(result.id).then(result => {
            expect(result)
                .not.toEqual(undefined);
            done();
        });
    })
});

it('Does Related Search With Self In History', done => {
    const song = new YouTubeSong(input);
    song.related([{ id: id }]).then(result => {
        expect(result.id)
            .not.toEqual(id);
        getById(result.id).then(result => {
            expect(result)
                .not.toEqual(undefined);
            done();
        });
    })
});

it('Ignores Non-Matching Ids While Doing Related Search', done => {
    const song = new YouTubeSong(input);
    song.related(
        [
            { id: 'non-matching-id-string' }
        ]
    ).then(result => {
        expect(result.id)
            .not.toEqual(id);
        expect(ids.indexOf(result.id) != -1)
            .toBe(true);
        done();
    })
});

it('Does Related Search With One Related Song In Memory', done => {
    const song = new YouTubeSong(input);
    song.related(
        [
            { id: ids[0] }
        ]
    ).then(result => {
        expect(result.id)
            .not.toEqual(id);
        expect(result.id)
            .not.toEqual(ids[0]);
        expect(ids.indexOf(result.id) != -1)
            .toBe(true);
        done();
    });
});

it('Does Related Search With Long Memory Of Related Songs', done => {
    const song = new YouTubeSong(input);
    song.related(
        [
            { id: ids[0] },
            { id: ids[1] },
            { id: ids[2] },
            { id: ids[3] },
            { id: ids[4] }
        ]
    ).then(result => {
        expect(result.id)
            .not.toEqual(id);
        expect(result.id)
            .not.toEqual(ids[0]);
        expect(result.id)
            .not.toEqual(ids[1]);
        expect(result.id)
            .not.toEqual(ids[2]);
        expect(result.id)
            .not.toEqual(ids[3]);
        expect(result.id)
            .not.toEqual(ids[4]);
        expect(ids.indexOf(result.id) != -1)
            .toBe(true);
        done();
    })
});
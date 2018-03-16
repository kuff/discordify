const { youtube_api_key } = require('../config.json');
//const { memory_size } = require('../settings.json');
const { Song, getById } = require('../src/youtube.js');
const YouTube = require('youtube-node');

const YouTubeSong = Song;

id = '5eZyspecXJE';
yt = new YouTube();
yt.setKey(youtube_api_key);
input = 'placeholder string';

beforeAll(done => {
    getById(id).then(result => {
        input = result;
        done();
    });
});

it('Initializes', () => {
    const song = new YouTubeSong(input);
    expect(     song)
    .toEqual(   input);
});

it('Plays', () => {
    // I have no idea how to test this btw...
});

it('Does Related Search With No History', done => {
    const song = new YouTubeSong(input);
    song.related([]).then(result => {
        expect(     result.id)
        .not.toBe(  id);
        done();
    })
});

it('Does Related Search With Self In History', done => {
    const song = new YouTubeSong(input);
    song.related([id]).then(result => {
        expect(     result.id)
        .not.toBe(  id);
        done();
    })
});

it('Ignores Non Matching Ids While Doing Related Search', done => {
    const song = new YouTubeSong(input);
    song.related(
        [
            'non-matching-id-string'
        ]
    ).then(result => {
        expect( result.id)
        .toBe(  'cRpdIrq7Rbo');
        done();
    })
});

it('Does Related Search With One Related Song In Memory', done => {
    const song = new YouTubeSong(input);
    song.related(
    [
        'cRpdIrq7Rbo'
    ]
    ).then(result => {
        expect( result.id)
        .toBe(  '_OBlgSz8sSM'); // If this fails the tests must be
        done();                 // rewritten, since the search no
    })                          // longer yeilds expected songs
});

it('Does Related Search With Full History Of Related Songs', done => {
    const song = new YouTubeSong(input);
    song.related(
    [
        'cRpdIrq7Rbo',
        '_OBlgSz8sSM',
        'uGYcRM5pFnE',
        'TP8RB7UZHKI',
        'G7RgN9ijwE4'
    ]
    ).then(result => {
        expect( result.id)
        .toBe(  'KPjqYisRbe8');
        done();
    })
});

id = '5eZyspecXJE';
result = 'placeholder string';
raw = result;

it('Doesn\'t Error On Correct Id', done => 
    getById(id, {}).then((response, error) => {
        expect(error)
            .toBe(undefined);
        result = response; // Results from normal run of util.getById
        yt.getById(id, (error, result) => {
            expect(error)
                .toBe(null);
            raw = result; // Raw response of yt.getById
            done();
        });
    })
);

it('Assigns Fields Correctly To Reponse Object', () => {
    expect(result)
        .not.toEqual('placeholder string');

    expect(result.link)
        .toEqual(`https://www.youtube.com/watch?v=${id}`);
    expect(result.id)
        .toEqual(raw.items[0].id);
    expect(result.message)
        .toEqual({});
    expect(result.title)
        .toEqual(raw.items[0].snippet.title);
    expect(result.artist)
        .toEqual(raw.items[0].snippet.channelTitle);
    expect(result.thumbnail)
        .toEqual(raw.items[0].snippet.thumbnails.default.url);
    expect(result.plays)
        .toEqual(raw.items[0].statistics.viewCount);
    expect(result.duration)
        .toEqual(raw.items[0].contentDetails.duration);
    expect(typeof result.yt)
        .toEqual(typeof yt);
});

it('Handles Invalid Ids With A Null Response', done => 
    getById('falseid', {}).then((response, error) => {
        expect(error)
            .toBe(undefined);
        expect(response)
            .toBe(undefined);
        done();
    })
);

// TODO: Test that related search always requests more items than 
// there are in history...
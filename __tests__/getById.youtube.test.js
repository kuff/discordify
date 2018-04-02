const { youtube_api_key } = require('../config.json');
const { getById } = require('../src/youtube.js');
const YouTube = require('youtube-node');
const moment = require('moment');

id = '5eZyspecXJE';
yt = new YouTube();
yt.setKey(youtube_api_key);
result = 'placeholder string';
raw = result;

it('Doesn\'t Error On Correct Id', done =>
    getById(id, {}).then((response, error) => {
        expect(error)
            .toBe(undefined);
        result = response; // Results from normal run of own getById
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
        .toEqual(moment.duration(
            raw.items[0].contentDetails.duration).asSeconds());
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

const list_of_ids = ['q6EoRBvdVPQ', '8YWl7tDGUPA', '6bnanI9jXps']

it('Handles Multiple Ids', async done => {
    const test = await getById(list_of_ids, {});
    const ids = list_of_ids.join(',');
    yt.getById(ids, (error, result) => {
        expect(Array.isArray(test))
            .toEqual(true);
        expect(test.map(elem => elem.id))
            .toEqual(result.items.map(elem => elem.id));
        done();
    });
})
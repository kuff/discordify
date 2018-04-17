const config = require('../config.json');

it('Recognizes Config Variables', () => {
    expect(config.token)
        .not.toEqual(undefined);
    expect(config.self_id)
        .not.toEqual(undefined);
    expect(config.youtube_api_key)
        .not.toEqual(undefined);
});
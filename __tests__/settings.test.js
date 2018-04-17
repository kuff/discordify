const settings = require('../settings.json');

it('Recognizes Setting', () => {
    expect(settings.prefix)
        .not.toEqual(undefined);
    console.log('prefix:', settings.prefix);
    expect(settings.embed_color)
        .not.toEqual(undefined);
    console.log('embed_color:', settings.embed_color);
    expect(settings.memory_size)
        .not.toEqual(undefined);
    console.log('memory_size:', settings.memory_size);
    expect(settings.default_volume)
        .not.toEqual(undefined);
    console.log('default_volume:', settings.default_volume);
    expect(settings.audio_passes)
        .not.toEqual(undefined);
    console.log('audio_passes:', settings.audio_passes);
});

/*it('Is Given Settings Variables With Acceptable Values', () => {
    // ...
});*/
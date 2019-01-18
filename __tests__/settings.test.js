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

it('Is Given Settings Variables With Acceptable Values', () => {
    // memory_size must be an integer between 2 and 47
    expect(Number.isInteger(settings.memory_size))
        .toBeTruthy();
    expect(settings.memory_size)
        .not.toBeLessThan(2);
    expect(settings.memory_size)
        .not.toBeGreaterThan(47);
    // expect default_volume to be a number
    expect(settings.default_volume)
        .not.toBeNaN();
    // audio_passes must be an integer greater than 0
    expect(Number.isInteger(settings.memory_size))
        .toBeTruthy();
    expect(settings.audio_passes)
        .not.toBeLessThan(1);
});
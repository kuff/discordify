const { formatPlays } = require('../src/util.js');

it('Works', () => {

    expect( formatPlays(1))
    .toBe(  '1');

    expect( formatPlays(16))
    .toBe(  '16');

    expect( formatPlays(100))
    .toBe(  '100');

    expect( formatPlays(112))
    .toBe(  '112');

    expect( formatPlays(1112))
    .toBe(  '1.112');

    expect( formatPlays(9239))
    .toBe(  '9.239');

    expect( formatPlays(19239))
    .toBe(  '19.239');

    expect( formatPlays(219239))
    .toBe(  '219.239');

    expect( formatPlays(3219239))
    .toBe(  '3.219.239');

    expect( formatPlays(43219239))
    .toBe(  '43.219.239');

    expect( formatPlays(543219239))
    .toBe(  '543.219.239');

    expect( formatPlays(6543219239))
    .toBe(  '6.543.219.239');
});

it('Handles Edge Cases?', () => {
    // ...
});
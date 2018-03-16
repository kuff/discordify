const { formatViews } = require('../src/util.js');

it('Positive Inputs', () => {

    expect( formatViews(1))
    .toBe(  '1');

    expect( formatViews(16))
    .toBe(  '16');

    expect( formatViews(100))
    .toBe(  '100');

    expect( formatViews(112))
    .toBe(  '112');

    expect( formatViews(1112))
    .toBe(  '1.112');

    expect( formatViews(9239))
    .toBe(  '9.239');

    expect( formatViews(19239))
    .toBe(  '19.239');

    expect( formatViews(219239))
    .toBe(  '219.239');

    expect( formatViews(3219239))
    .toBe(  '3.219.239');

    expect( formatViews(43219239))
    .toBe(  '43.219.239');

    expect( formatViews(543219239))
    .toBe(  '543.219.239');

    expect( formatViews(6543219239))
    .toBe(  '6.543.219.239');
});
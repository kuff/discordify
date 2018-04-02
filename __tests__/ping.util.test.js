const { ping } = require('../src/util.js');
const embeds = require('../src/embeds.js');

const clientMock = {
    ping: 101,
    pings: [102,103,104] // Last two values should not be used!
}

const messageMock = {
    send: async message => {
        return messageMock;
    }
}

it('Works', async () => {
    const before = Date.now();
    const result = await ping(messageMock);
    const diff = Date.now() - before;
    expect(embeds.ping(clientMock, result))
        .toEqual(embeds.ping(clientMock, diff));
});
const { getById, getPlaylistById } = require("../src/youtube.js");
const Fetcher = require("../src/fetch.js");

const id = "5eZyspecXJE";
const list_id = "PLEQoAV22e4i1v8WG1ZzyW6Jmh-P7oaRBB";
const invalid_link =
  "https://facebook.github.io/jest/docs/en/jest-object.html#jestsettimeouttimeout";

const video_query = "never gonna give you up";
const playlist_query = "important videos playlist";
const bad_query = "apsodufhjqoierfhqoiwefljcnwe1480923fuwhcnqliw";

const f = new Fetcher();

const messageMock = {
  send: () => messageMock
};

jest.setTimeout(30000);

it("Correctly Fetches Single YouTube Videos From Typical Links", async done => {
  const test = await f.get(
    [`https://www.youtube.com/watch?v=${id}`],
    messageMock
  );
  const expected = await getById(id);
  test.message = undefined;
  expect(JSON.stringify(test)).toEqual(JSON.stringify(expected));
  done();
});

it('Correctly Fetches Single YouTube Videos From "Share" Links', async done => {
  const test = await f.get([`https://youtu.be/${id}`], messageMock);
  const expected = await getById(id);
  test.message = undefined;
  expect(JSON.stringify(test)).toEqual(JSON.stringify(expected));
  done();
});

it("Fetches YouTube Playlists From Links", async done => {
  const test = await f.get(
    [`https://www.youtube.com/watch?v=${id}&list=${list_id}`],
    messageMock
  );
  const set = new Set();
  test.forEach(elem => set.add(elem.id));
  const expected = await getPlaylistById(list_id, messageMock);
  expected.forEach(elem => set.add(elem.id));
  expect(set.size).toEqual((test.length + expected.length) / 2);
  done();
});

it("Returns Undefined On Invalid Link", async done => {
  expect(await f.get([invalid_link], messageMock)).toEqual(undefined);
  done();
});

it("Fetches YouTube Videos From Queries", async done => {
  expect(await f.get([video_query], messageMock)).toEqual(
    await getById("dQw4w9WgXcQ", messageMock)
  );
  done();
});

it("Fetches YouTube Playlists From Queries", async done => {
  const test = f.get([playlist_query], messageMock);
  const expected = getPlaylistById(
    "PLFsQleAWXsj_4yDeebiIADdH5FMayBiJo",
    messageMock
  );
  await Promise.all([test, expected]);
  expect(test).toEqual(expected);
  done();
});

it("Return Undefined On Bad Query", async done => {
  expect(await f.get([bad_query], messageMock)).toEqual(undefined);
  done();
});

it("Queues Requests", async done => {
  const test = f.get(
    [`https://www.youtube.com/watch?v=${id}&list=${list_id}`],
    messageMock
  );
  setTimeout(async () => {
    const test2 = f.get([`https://www.youtube.com/watch?v=${id}`], messageMock);
    await test;
    expect(test2).not.toHaveProperty("id");
    test2.then(result => {
      expect(result).toHaveProperty("id");
      expect(result.id).toEqual(id);
      done();
    });
  }, 100);
});

it("Resets The Queue When Done", async done => {
  let test = f.get([`https://www.youtube.com/watch?v=${id}`], messageMock);
  expect(f.queue.length).toEqual(1);
  await test;
  expect(f.queue.length).toEqual(0);
  f.get([`https://www.youtube.com/watch?v=${id}&list=${list_id}`], messageMock);
  test = f.get([`https://www.youtube.com/watch?v=${id}`], messageMock);

  setTimeout(async () => {
    expect(f.queue.length).toEqual(2);
    await test;
    expect(f.queue.length).toEqual(0);
    done();
  }, 50);
});

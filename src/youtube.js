const { youtube_api_key } = require("../config.json");
const Song = require("./song.js"); // local superclass
const YouTube = require("youtube-node"); // basic api wrapper
const ytdl = require("ytdl-core"); // used for video streaming
const axios = require("axios"); // used for raw api requests
const moment = require("moment"); // used to convert video durations into seconds

// save YouTube api key to wrapper
const yt = new YouTube();
yt.setKey(youtube_api_key);

const lib = {
  Song: class YouTubeSong extends Song {
    constructor(args) {
      super(args);
    }

    /**
     * play the specific video based on associated link attribute
     */
    play(bitrate = 64) {
      return new Promise(async (resolve, reject) => {
        ytdl
          .getInfo(this.link)
          .then(info => {
            // retrieve song info and filter based on voice channel bitrate and prefered audio codec
            let formats = ytdl.filterFormats(info.formats, "audioonly"); // sort for audio
            if (this.duration === 0)
              // sort for appropriate audio formats, view entire itag catalog
              // here: https://github.com/fent/node-ytdl-core/blob/HEAD/example/info.json
              // more on itag: https://en.wikipedia.org/wiki/YouTube#Quality_and_formats
              formats = ytdl.filterFormats(
                info.formats,
                format => format.itag > 90 && format.itag < 96
              );
            let prevFormats = formats;
            // sort for desired bitrate, based on Discord voice-channel bitrate
            formats = ytdl.filterFormats(
              info.formats,
              format => format.audioBitrate === bitrate
            );
            if (formats.length === 0)
              // reset to previous selected formats if no optimal bitrate was found,
              // which will result in the highest available bitrate being selected
              formats = prevFormats;
            else prevFormats = formats;
            // filter for desired audio encoding protocol
            formats = ytdl.filterFormats(
              info.formats,
              format => format.audioEncoding === "opus"
            );
            if (formats.length === 0)
              // reset if no desired audio encoding was found
              formats = prevFormats;

            // if no audio formats were found at all, reject the promise, giving up on
            // attempting to play the song
            if (!formats[0]) return reject();
            // otherwise, resolve the promise with a ReadableStream object of the
            // audio-portion of the video, based on previously selected formats
            resolve(
              ytdl.downloadFromInfo(info, {
                filter: format => format.itag === formats[0].itag
              })
            );
          })
          // catch any errors and pass them on
          .catch(error => reject(error));
      });
    }

    /**
     * search the YouTube api for similar videos
     */
    related(history = []) {
      return new Promise((resolve, reject) => {
        // perform the YouTube api query
        yt.related(
          this.id,
          history.length + 3, // make sure to request an excess of videos in case only previously played songs result from the search
          (error, result) => {
            if (error) {
              // pass any encountered erros on to the caller
              console.log(error);
              return reject(error);
            }

            // map every entry in provided list of previously played songs to their ids for easy comparing
            history = history.map(elem => elem.id);
            // filter out recently played videos
            let remaining = result.items.reduce((array, elem) => {
              if (array.length === 3) return array; // guarenteed no overlap with recently played videos, if only 3 entries remain
              // for each entry, find the id and make sure that id does not exist in history array
              const id = elem.id.videoId;
              if (history.indexOf(id) !== -1)
                // go to next video if this one has been played recently
                return array;
              // otherwise, append the id to the final array and return
              array.push(id);
              return array;
            }, []);
            // generate a random integer between 0 and 2 inclusive
            const rand = Math.round(Math.random() * 2);

            // select a random entry among the three top results that were not recently played and resolve it
            lib.getById(remaining[rand], this.message).then((result, error) => {
              if (error) return reject(error); // pass on any errors
              return resolve(result);
            });
          }
        );
      });
    }
  },

  /**
   * turn a YouTube video id into a YouTubeSong object
   */
  getById: (id, message) =>
    new Promise(resolve => {
      // if passed more than one id, concatinate them into a string for api request
      if (Array.isArray(id)) id = id.join(",");
      yt.getById(id, (error, result) => {
        if (error) {
          // return undefined if the request failed
          console.log(error);
          return resolve(undefined); // reject to error
        }
        if (!result || !result.items || result.items.length === 0) {
          // return undefined if response object is faulty in any way
          return resolve(undefined);
        }
        const output = result.items.map(
          elem =>
            // expect response object to be ok and construct and return new YouTubeSong object
            new lib.Song({
              link: `https://www.youtube.com/watch?v=${elem.id}`,
              id: elem.id,
              message: message,
              title: elem.snippet.title,
              artist: elem.snippet.channelTitle,
              thumbnail: elem.snippet.thumbnails.default.url,
              plays: elem.statistics.viewCount,
              duration: moment
                .duration(elem.contentDetails.duration)
                .asSeconds() // convert video duration data into seconds
            })
        );
        // if the final array contains only one YouTubeSong object, just return the object without the array
        if (output.length === 1) return resolve(output[0]);
        // otherwise, return the array of results
        return resolve(output);
      });
    }),
  /**
   * turn a YouTube playlist id into a list of YouTubeSong objects
   */
  getPlaylistById: async (id, message) =>
    new Promise(async (resolve, reject) => {
      let output = [];
      let pageToken = "placeholder";
      let totalResults;
      let i = 0;
      while (pageToken) {
        // perform a "raw" api request for each response containing a pageToken
        const items = await new Promise(
          async resolve =>
            await axios
              .get(
                "https://www.googleapis.com/" +
                  "youtube/v3/playlistItems" +
                  `?key=${youtube_api_key}` +
                  "&maxResults=50" +
                  "&part=snippet,id,contentDetails" +
                  (pageToken !== "placeholder"
                    ? `&pageToken=${pageToken}`
                    : "") +
                  `&playlistId=${id}`
              )

              .then(async response => {
                const result = response.data;
                totalResults = result.pageInfo.totalResults; // remember the totalResults for progress calculations
                i++;

                if (!result || !result.items || result.items.length === 0) {
                  // if a pageToken leads to a response with no results, give up
                  await message.send(
                    "an error occured during playlist retrieval!"
                  );
                  return resolve(undefined);
                }

                // map the response object onto a list of video ids
                const ids = result.items.map(
                  elem => elem.snippet.resourceId.videoId
                );
                // then fetch all videos
                const videos = lib.getById(ids, message);

                // refresh pageToken if there is one
                if (pageToken && result.nextPageToken !== pageToken) {
                  pageToken = result.nextPageToken;
                } else {
                  pageToken = undefined;
                }

                // resolve retrieved videos
                resolve(await videos);
              })
              // give up on errors
              .catch(() => resolve(undefined))
        );

        if (!items) {
          // notify user if process failed
          await message.send("an error occured during playlist retrieval!");
          return resolve(undefined);
        }
        // calculate the progress percentage and display it to the user
        const percent = Math.round((100 / (totalResults / 50)) * i);
        if (totalResults > 50 && percent < 100)
          await message.send("processing... `" + percent + "%`");
        // append all resulting items to the final output list
        items.forEach(elem => output.push(elem));
      }
      // return the final output
      return resolve(output);
    }),
  /**
   * search the YouTube api for playlists or individual videos based on a query
   */
  search: async (query, message) =>
    new Promise(async resolve => {
      yt.search(
        query,
        1,
        { type: "video,playlist" }, // request one response object of type either video or playlist
        async (error, result) => {
          if (error) {
            // give up on error
            message.send(error);
            return resolve(undefined);
          }
          if (result.items.length === 0)
            // give up if no object was recieved
            return resolve(undefined);

          // save id of response object and use appropriate fetching technique
          const id = result.items[0].id;
          if (id.kind === "youtube#video") {
            // resolve individual videos using getById
            return resolve(await lib.getById(id.videoId, message));
          }
          // resolve playlists using getPlaylistById
          const output = await lib.getPlaylistById(id.playlistId, message);
          // add list_ids to song links
          output.forEach(elem => (elem.link += `&list=${id.playlistId}`));
          // finally, return the result
          resolve(output);
        }
      );
    })
};

// export the final module
module.exports = lib;

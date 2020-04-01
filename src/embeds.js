const { version } = require("../package.json");
const { embed_color, prefix } = require("../settings.json");
const { formatTime } = require("./util.js");

module.exports = {
  ping: (client, roundtime) => {
    return {
      embed: {
        color: embed_color,
        footer: {
          text: `This bot is running Discordify v${version}`
        },
        fields: [
          {
            name: "Latest heatbeat",
            value: "`" + client.pings[0] + " ms`",
            inline: true
          },
          {
            name: "Avarage",
            value: "`" + Math.round(client.ping) + " ms`",
            inline: true
          },
          {
            name: "Message round-time",
            value: "`" + roundtime + " ms`",
            inline: true
          }
        ]
      }
    };
  },

  playing: instance => {
    const song = instance.playing;
    const queue = instance.queue;
    const duration = song.duration === 0 ? "∞" : formatTime(song.duration);

    // generate embed
    const embed = {
      embed: {
        title: song.title,
        description: "by *" + song.artist + "*",
        url: song.link,
        color: embed_color,
        footer: {
          icon_url: song.message.author.avatarURL,
          text: "Suggested by " + song.message.author.username
        },
        thumbnail: {
          url: song.thumbnail
        },
        author: {
          name: duration
        },
        fields: []
      }
    };

    const next = queue.peek();
    if (next) {
      embed.embed.fields[0] = {
        name: "Up next",
        value: "*" + next.title + "*\n" + "by *" + next.artist + "*"
      };
      embed.embed.footer.text += ` • ${queue.size()} entr${
        queue.size() > 1 ? "ies" : "y"
      } in queue • ${instance.queueTime()} queue time`;
    }
    if (song.flags.indexOf("loop") !== -1)
      embed.embed.author.name += " (looping)";
    return embed;
  },

  queued: (instance, song, queue_length) => {
    const queue = instance.queue;
    const playing = instance.playing;
    const dispatcher = instance.dispatcher
      ? instance.dispatcher
      : {
          time: 0
        };
    const remaining = formatTime(
      playing.duration - Math.round(dispatcher.time / 1000)
    );

    let duration;
    let songs;
    if (Array.isArray(song)) {
      songs = song;
      song = songs[0];
      duration = instance.queueTime(songs);
    } else duration = formatTime(song.duration);

    const new_songs = songs ? songs.length : 1;
    const queue_size = queue.size() - new_songs + 1;

    if (queue.peek() === song && queue_length !== "∞") {
      if (playing.duration > 0)
        queue_length = formatTime(
          Math.round(playing.duration - dispatcher.time / 1000)
        );
      else queue_length = "∞";
    }

    if (dispatcher.paused) queue_length += " (paused)";
    else if (queue_size > 1) queue_length += ` (${queue_size} entries)`;

    // generate embed
    return (embed = {
      embed: {
        title: song.title,
        description: "by *" + song.artist + "*",
        url: song.link,
        color: embed_color,
        footer: {
          icon_url: playing.message.author.avatarURL,
          text: `Currently playing "${playing.title}" 
                        ${
                          queue.peek() !== song
                            ? ` with ${remaining} remaining`
                            : ` by ${playing.artist}`
                        }`
        },
        thumbnail: {
          url: song.thumbnail
        },
        author: {
          name: `Queued ${
            songs ? `${songs.length} entries, including:` : "an entry:"
          }`
        },
        fields: [
          {
            name: "Duration",
            value: "`" + (song.duration === 0 ? "∞" : duration) + "`",
            inline: true
          },
          {
            name: "Queue time",
            value: "`" + queue_length + "`",
            inline: true
          }
        ]
      }
    });
  },

  remaining: instance => {
    const queue = instance.queue;
    const playing = instance.playing;
    const dispatcher = instance.dispatcher
      ? instance.dispatcher
      : {
          time: 0
        };
    const time_played =
      formatTime(Math.round(dispatcher.time / 1000)) +
      (dispatcher.paused ? " (paused)" : "");

    // generate embed
    const embed = {
      embed: {
        title: playing.title,
        description: "by *" + playing.artist + "*",
        url: playing.link,
        color: embed_color,
        footer: {
          icon_url: playing.message.author.avatarURL,
          text:
            "Suggested by " +
            playing.message.author.username +
            " • nothing in queue"
        },
        thumbnail: {
          url: playing.thumbnail
        },
        author: {
          name: "Currently playing:"
        },
        fields: [
          {
            name: "Time played",
            value: "`" + time_played + "`",
            inline: true
          },
          {
            name: "Remaining",
            value:
              "`" +
              (playing.duration === 0
                ? "∞"
                : formatTime(
                    Math.round(playing.duration - dispatcher.time / 1000)
                  )) +
              "`",
            inline: true
          }
        ]
      }
    };

    const next = queue.peek();
    if (next) {
      embed.embed.fields[2] = {
        name: "Up next",
        value: "*" + next.title + "*\n" + "by *" + next.artist + "*"
      };
      embed.embed.footer.text = `Suggested by ${
        playing.message.author.username
      } • 
                ${queue.size()} entr${queue.size() > 1 ? "ies" : "y"} 
                in queue • ${instance.queueTime()} queue time`;
    }
    return embed;
  },

  help: message => {
    return {
      embed: {
        title: "Link to source code",
        url: "https://github.com/kuff/discordify",
        color: embed_color,
        author: {
          name: "Help has arrived!"
        },
        description:
          "Following is a list of all " +
          "available commands, explaining how to use " +
          "them and what they do.",
        footer: {
          text: `Sent from #${message.obj.channel.name} 
                        in ${message.obj.guild.name} by Discordify 
                        v${version}`
        },
        fields: [
          {
            name: "`" + prefix + "help`",
            value:
              "Sends a table of all " +
              "available commands as a direct " +
              "message to the issuer (this)\n~"
          },
          {
            name: "`" + prefix + "ping`",
            value:
              "Shows the heartbeat ping " +
              "and performs a message-round-time " +
              "measurement\n\n" +
              "       **aliases:** `latency`, `measure`\n~"
          },
          {
            name: "`" + prefix + "play <params> --<flags?>`",
            value:
              "Attempts to fetch the song given " +
              "as a parameter and initiate playback" +
              " if not already playing, else adding" +
              " the result to the queue\n\n" +
              "       **aliases:** `song`, `s`\n" +
              "       **supported params:** YouTube video- or playlist links as well as search queries\n" +
              "       **supported flags: (optional)**\n" +
              "               `shuffle`: shuffles the requested playlist\n" +
              "               `next`: inserts requested entry(s) at the start of the queue\n" +
              "               `loop`: loops the requested entry(s) until skipped with `" +
              prefix +
              "skip`\n" +
              "               `autoplay`: automatically queues related songs when the requested entry\n       finishes playing and the queue is empty\n" +
              "       **conditions:** you must be in a voice channel to use this command and if music is\n       already playing, you must be in the same voice channel as the bot\n~"
          },
          {
            name: "`" + prefix + "playit`",
            value:
              "Attempts to parse and play the last message in the text channel where the command is invoked\n\n" +
              "       **aliases:** `pi`\n" +
              "       **conditions:** you must be in a voice channel to use this command and if music is\n       already playing, you must be in the same voice channel as the bot\n~"
          },
          {
            name: "`" + prefix + "pause`",
            value:
              "Pauses playback\n\n" +
              "       **aliases:** `p`\n" +
              "       **conditions:** you must be in the same voice channel as the bot and it has to be\n       playing\n~"
          },
          {
            name: "`" + prefix + "resume`",
            value:
              "Resumes playback\n\n" +
              "       **aliases:** `start`, `unpause`, `up`\n" +
              "       **conditions:** you must be in the same voice channel as the bot and playback has\n       to be paused\n~"
          },
          {
            name: "`" + prefix + "skip`",
            value:
              "Skips the entry currently playing\n\n" +
              "       **aliases:** `next`\n" +
              "       **conditions:** you must be in the same voice channel as the bot and it has to be\n       playing or paused\n~"
          },
          {
            name: "`" + prefix + "remaining`",
            value:
              "Retrieves som info on the song currently playing as well as the queue\n\n" +
              "       **aliases:** `playing`, `left`, `queue`\n" +
              "       **conditions:** you must be in the same voice channel as the bot and it has to be\n       playing or paused\n~"
          },
          {
            name: "`" + prefix + "replay`",
            value:
              "Replays the last song played, even if playback has ended\n\n" +
              "       **aliases:** `rp`\n" +
              "       **conditions:** you must be in the same voice channel as the bot and a song must've\n       played before\n~"
          },
          {
            name: "`" + prefix + "loop`",
            value:
              "loops the song currently playing, skippable with `" +
              prefix +
              "skip`\n\n" +
              "       **conditions:** you must be in the same voice channel as the bot and it has to be\n       playing or paused\n~"
          },
          {
            name: "`" + prefix + "autoplay`",
            value:
              "autoplays similar songs to the song currently playing, when the current song ends\n\n" +
              "       **conditions:** you must be in the same voice channel as the bot and it has to be\n       playing or paused\n~"
          },
          {
            name: "`" + prefix + "end`",
            value:
              "Ends playback\n\n" +
              "       **aliases:** `stop`\n" +
              "       **conditions:** you must be in the same voice channel as the bot and it has to be\n       playing or paused\n~"
          }
        ]
      }
    };
  }
};

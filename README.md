# discordify
*A single-server focused music bot for Discord.*
## Installation
You are of course free to use this software however you like, as per the MIT license. Following is a short tutorial on how to spin up your own instance of the bot.
however, in order to run, the bot requires some credentials - more specifically a **Discord bot token** as well as the **id** of the bot user and a **YouTube api key**.

1.  A **Discord bot token** is optained by creating a new app on the [Discord app dashboard](https://discordapp.com/developers/applications) and then registering the app as a Bot User.
2.  The **id** of the bot user can then also be copy-pasted from the Discord app dashboard.
3.  A **YouTube API v3 key** can be optained for free by logging in to the [Google API Dashboard](https://console.cloud.google.com/apis) and registering a new project. After this, YouTube API v3 can be found under the "Library" tab on the left hand side, where you can choose to generate a new api key.

Hold on to this information, as it will become relevant in a minute. Now, for the actual installation process. This will be detailed using the command line on an *Ubuntu 16.04* machine, even though the code should be able to run in any environment that supports [NodeJS](https://nodejs.org/en/). Along with *NodeJS*, this guide also assumes that you have [Git](https://git-scm.com/) and [NPM](https://www.npmjs.com/) installed.

1.  Start by navigating to a suitable place for the bot source files to be installed.
2.  Next download the bot source files with `git clone https://github.com/kuff/discordify.git` and enter the directory by typing in `cd discordify`.
3.  Now, install [FFMPEG](https://www.ffmpeg.org/) with `sudo apt-get install ffmpeg`. This is needed for streaming audio over Discord voice chat.
4.  Next up, install the bot dependencies with `npm i`.
5.  Now those credentials from earlier come into play. Start by creating a config.json file with `touch config.json` and open it in your favorite text editor.
6.  Then copy-paste the information gathered earlier, structured the following way:

```
{
    "token": "discord_bot_token_goes_here",
    "self_id": "discord_bot_id_goes_here",
    "youtube_api_key": "youtube_api_key_goes_here"
}
```
7.  After typing in your information and saving the file you should be all set. The bot also ships with built in automated tests that can be run with `npm test` - if they pass you should be all set! The tests are fairly bandwidth intensive and if they fail due to a timeout it should be an indication that your bandwidth is less than ideal for streaming music through the Discord API. I recommend hosting the bot on a machine with a dedicated CPU, as my personal experience is that a vCPU is not enough since audio encoding can be pretty demanding.
8.  Now, invite the bot to you Discord server by visiting the following link, substituting "BOT_ID_GOES_HERE" with your own bot id: https://discordapp.com/oauth2/authorize?&client_id=BOT_ID_GOES_HERE&scope=bot&permissions=0.
9.  Finally, spin up the bot with `npm start`. However, for long term program execution you should look into [PM2](http://pm2.keymetrics.io/).

Let me know if you have any trouble or suggestions!

**– kuff**

const { token } = require('../config.json');
const { prefix } = require('../settings.json');
const { ping } = require('./util.js');
const Playback = require('./playback.js');
const Queue = require('./queue.js');
const Fetcher = require('./fetch.js');
const Discord = require('discord');

const client = new Discord.Client();
const q = new Queue();
const f = new Fetcher(q);
const pb = new Playback(client, q, f);

client.on('ready', () => 
    console.log("I am ready!")
    // Refer to help command when available...
)

client.on('message', message => {

    if (message.author.id === client.user.id) return;

    const args = message.content.trim().split(/ +/g);
    let command = args.shift().toLowerCase();
    const p = command[0];
    command = command.slice(prefix.length);

    // Figure out a way to catch flags...
    
    if (p !== prefix) return;

    console.log(args);
    console.log(command);

    switch(command) {

        case 'help':
        case 'h':
            // ...
            break;

        case 'ping':
            ping(client, message);
            break;

        case 'play':
        case 'song':
        case 'p':
            // ...
            break;

        case 'pause':
            // ...
            break;

        case 'unpause':
        case 'resume':
            // ...
            break;
        
        case 'remaining':
            // ...
            break;

        case 'skip':
            // ...
            break;

        case 'previous':
        case 'replay':
            // ...
            break;

        case 'volume':
        case 'v':
            // ...
            break;
            
        case 'stop':
        case 'end':
            // ...
            break;
        
        case 'reload':
            q = new Queue();
            f = new Fetcher();
            pb = new Playback();
            // ...
            break;
            
    }
});

client.login(token);
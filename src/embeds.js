const version = require('../package.json').version;
const { embed_color } = require('../settings.json');

module.exports = {
    ping: (client, roundtime) => {
        return {
            embed: {
                color: embed_color,
                footer: {
                    text: `A heatbeat is sent every 45 seconds • Discordify v${version} (beta)`
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
        }
    }
}
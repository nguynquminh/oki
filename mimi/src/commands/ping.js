module.exports = {
    name: 'ping',
    description: 'Lệnh ping',
    async execute(message, args, client) {
        const latency = Date.now() - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);

        await message.reply(
            `🏓 Pong!\n**Message latency:** ${latency}ms\n**API latency:** ${apiLatency}ms`
        );
    },
};
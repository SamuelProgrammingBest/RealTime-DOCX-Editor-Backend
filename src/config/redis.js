const { createClient } = require('redis');

const connectRedis = async () => {
    const client = createClient()

    client.on('error', () => { });

    // 3. Establish connection
    await client.connect();
    return client
}

module.exports = { connectRedis }
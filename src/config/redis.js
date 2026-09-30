const { createClient } = require('redis');

const connectRedis = async () => {
    const client = createClient(
        {
            url: process.env.REDIS_URL
        }
    )

    client.on('error', () => {
        console.error('Redis Client Error', err);
    });

    client.on('connect', () => {
        console.log('Connected to Render Redis successfully!');
    });

    // 3. Establish connection
    await client.connect();
    return client
}

module.exports = { connectRedis }
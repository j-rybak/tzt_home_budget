var Redis = require('ioredis');
var redisDB = new Redis({
    port: 11138,          // Redis port
    host: 'pub-redis-11138.eu-central-1-1.1.ec2.redislabs.com',   // Redis host
    family: 4,           // 4 (IPv4) or 6 (IPv6)
    password: 'P5dGu5g4DFlCn68L',
    db: 0
})

module.exports = redisDB;

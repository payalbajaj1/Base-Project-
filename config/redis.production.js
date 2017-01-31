'use strict';
const redisUniXSocketPath = '/var/run/redis/redis.sock';
const redisTcpConfig = {
    port: 6379,          // Redis port
    host: '127.0.0.1',   // Redis host
    family: 4,           // 4 (IPv4) or 6 (IPv6)
    password: 'auth',
    db: 0
};

module.exports = {
    redisUniXSocketPath: redisUniXSocketPath,
    redisTcpConfig: redisTcpConfig
};
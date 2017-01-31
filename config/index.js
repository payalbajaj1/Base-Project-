'use strict';
let async = require("async");
let config = {};
let myEnv = process.env.NODE_ENV.toLowerCase();
let mysql = require("mysql");
let mongoose = require("mongoose");
let myRedis;
let dbConnection;
let RedisModule = require('ioredis');
let redisConfig = require('config/redis.' + myEnv);
const winston = require('winston');
const fs = require('fs');
const logDir = 'log';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const tsFormat = () => (new Date()).toLocaleTimeString();
const myLogger = new (winston.Logger)({
    transports: [
        // colorize the output to the console
        new (winston.transports.Console)({
            timestamp: tsFormat,
            colorize: true,
            level: myEnv === 'development' ? 'silly' : 'info'
        }),
        new (require('winston-daily-rotate-file'))({
            filename: `${logDir}/-results.log`,
            timestamp: tsFormat,
            datePattern: 'yyyy-MM-dd',
            prepend: true,
            level: myEnv === 'development' ? 'silly' : 'info'
        })
    ]
});
config.myLogger = myLogger;
config.auth = require('config/auth.' + myEnv);
config.db = require('config/db.' + myEnv);
config.constants = require('config/appConstants.' + myEnv);
config.amazon = require('config/aws.' + myEnv);
config.shopping = require('config/payment.' + myEnv);
config.redis = redisConfig;
config.socket = require('config/socket.' + myEnv);

if (process.env['REDIS_USE_UNIX_DOMAIN_SOCKET'] === 'true') {
    myRedis = new RedisModule(redisConfig.redisUniXSocketPath);
}
if (process.env['REDIS_USE_TCP'] === 'true') {
    myRedis = new RedisModule(redisConfig.redisTcpConfig)
}
let dbGateway = process.env['DB_TO_USE'].toLowerCase();
let mongoUri;
let mysqlConfig = config.db.mysqlConfig;
let mongoConfig = config.db.mongoDbConfig;
let initConnectionToMySQL = function (calback) {
    dbConnection = mysql.createConnection(mysqlConfig);
    // Recreate the connection, since
    // the old one cannot be reused.
    dbConnection.connect(function (err) {
        // The server is either down
        if (err) {
            // or restarting (takes a while sometimes).
            myLogger.error('error when connecting to db:', err);
            return calback(err);
        } else {
            myLogger.info('Connected to MySQL');
            return calback(null);
        }
    });
    dbConnection.on('error', function (err) {
        myLogger.error('db error', err);
        myLogger.error('\nTRYING TO HANDLE DISCONNECT\n', err.code, typeof err.code);
        // Connection to the MySQL server is usually
        // lost due to either server restart, or a
        // connnection idle timeout (the wait_timeout
        // server variable configures this)
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            myLogger.info('\n TRYING TO CALL handleDisconnect \n', err);
            initConnectionToMySQL(function (e, d) {

            });
        }
    });
};


const keepDBConnectionAlive = function () {
    dbConnection.query('SELECT 1',
        function (err, rows) {
            if (err) {
                myLogger.error('ERROR in query SELECT 1', err);
            } else {
                myLogger.info(rows);
            }
        });
};


config.myRedisConnection = myRedis;


function createMongoUri(usr, pswd, host, port, db) {
    return `mongodb://${usr}:${pswd}@${host}:${port}/${db}`;
}


module.exports = {
    getConfig: function (cb) {
        async.series([
            function (calbc) {
                myRedis.set("TEST_REDIS_KEY", "TEST_REDIS_VALUE");

                myRedis.get("TEST_REDIS_KEY", function (e, v) {

                    if (e) {
                        myLogger.error("Connection to Redis failed");
                        return calbc(e);
                    }
                    if (v && v == "TEST_REDIS_VALUE") {
                        myLogger.info("Connected to Redis");
                        return calbc(null);
                    } else {
                        myLogger.error("Connection to Redis failed");
                        return calbc(e);
                    }

                });
            }, function (calbc) {
                switch (dbGateway) {
                    case "mysql_and_mongodb":
                        mongoUri = createMongoUri(mongoConfig.user, mongoConfig.password, mongoConfig.host, mongoConfig.port, mongoConfig.database);
                    case "mysql":
                        initConnectionToMySQL(calbc);
                        break;
                    case "mongodb":
                        mongoUri = createMongoUri(mongoConfig.user, mongoConfig.password, mongoConfig.host, mongoConfig.port, mongoConfig.database);
                        return calbc(null);
                        break;
                    case "default":
                        return calbc(null);
                        break;
                }
            }, function (calbc) {
                switch (dbGateway) {
                    case "mysql_and_mongodb":
                        setInterval(function () {
                            keepDBConnectionAlive();
                        }, 60000);
                        config.mySqlConnection = dbConnection;
                        mongoose.connect(mongoUri, function (err) {
                            if (err) {
                                return calbc(err);
                            } else {
                                myLogger.info("Connected to MongoDB");
                                return calbc(null);
                            }
                        });
                        break;
                    case "mysql":
                        setInterval(function () {
                            keepDBConnectionAlive();
                        }, 60000);
                        config.mySqlConnection = dbConnection;
                        return calbc(null);
                        break;
                    case "mongodb":
                        mongoose.connect(mongoUri, function (err) {
                            if (err) {
                                return calbc(err);
                            } else {
                                myLogger.info("Connected to MongoDB");
                                return calbc(null);
                            }
                        });
                        break;
                }

            }, function (calbc) {
                global.baseConfig = config;
                return calbc(null);
            }
        ], function (e, d) {
            if (e) {
                myLogger.error(e);
                process.exit(1);
            }
            return cb(config);
        });
    }
}



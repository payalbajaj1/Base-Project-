'use strict';

const mysqlConfig = {
    host: 'localhost',
    database: 'payal',
    password: 'payal',
    user: 'root',
    debug: false,
    port: 3306,
    multipleStatements: true
};
const mongoDbConfig = {
    host: 'localhost',
    database: 'payal',
    password: 'payal',
    user: 'root',
    debug: false,
    port: 27017
};
module.exports = {
    mysqlConfig: mysqlConfig,
    mongoDbConfig: mongoDbConfig
};

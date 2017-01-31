const mTypeSchema = require("schema/mysql/membershipType");
const mTypeTable = mTypeSchema.tableName;
const mTypeFieldmap = mTypeSchema.fieldMap;
const config = global.baseConfig;
const mySqlConnection = config.mySqlConnection;
const mysql = require("mysql");
const Q = require("q");
const mConstants = config.constants;

const getMembershipInfo = function (filters, informationRequired, mustFetchAll) {
    'use strict';
    let deferred = Q.defer();
    if (!filters) {
        filters = {};
    }
    if (!informationRequired) {
        informationRequired = {};
    }
    let reqFields = [];
    for (let idx in informationRequired) {
        if (informationRequired.hasOwnProperty(idx)) {
            if (mTypeFieldmap.hasOwnProperty(informationRequired[idx])) {
                if (informationRequired[idx] == mTypeFieldmap.id) {
                    reqFields.push("HEX(" + mTypeFieldmap.id + ") AS " + mTypeFieldmap.id);
                } else {
                    reqFields.push("`" + informationRequired[idx] + "`");
                }

            } else {
                delete informationRequired[idx];
            }
        }
    }
    if (mustFetchAll === true) {
        reqFields = [];
        for (let idx in mTypeFieldmap) {
            if (mTypeFieldmap.hasOwnProperty(idx)) {
                if (mTypeFieldmap[idx] == mTypeFieldmap.id) {
                    reqFields.push("HEX(" + mTypeFieldmap.id + ") AS " + mTypeFieldmap.id);
                } else {
                    reqFields.push("`" + mTypeFieldmap[idx] + "`");
                }
            }
        }
    }
    if (reqFields.length > 0) {
        reqFields = reqFields.join(",");
    } else {
        reqFields = "HEX(" + mTypeFieldmap.id + ") AS " + mTypeFieldmap.id;
    }
    let mSql = "SELECT " + reqFields + " FROM `" + mTypeTable + "` WHERE ";

    let bindParams = [];
    let queryParts = [];

    if (filters[mTypeFieldmap.id]) {
        if (filters[mTypeFieldmap.id].length % 2) {
            deferred.reject(messages.errors.eng.violation.THE_ID_IS_INVALID.customMessage);
            return deferred.promise;
        }
        queryParts.push("`" + mTypeFieldmap.id + "`=?");
        bindParams.push(new Buffer(filters[mTypeFieldmap.id], 'hex'));
    }
    if (filters[mTypeFieldmap.name]) {
        queryParts.push("`" + mTypeFieldmap.name + "`=?");
        bindParams.push(filters[mTypeFieldmap.name]);
    }
    if (filters.hasOwnProperty(mTypeFieldmap.enabled) && filters[mTypeFieldmap.enabled] == 0 || filters[mTypeFieldmap.enabled] == 1) {
        queryParts.push("`" + mTypeFieldmap.enabled + "`=?");
        bindParams.push(filters[mTypeFieldmap.enabled]);
    }
    if (bindParams.length > 0) {
        mSql = mSql + queryParts.join(" AND ");
        mSql = mysql.format(mSql, bindParams);
    } else {
        mSql = "SELECT " + reqFields + " FROM `" + mTypeTable;
    }

    mySqlConnection.query(mSql, function (error, results, fields) {
        if (error) {
            if (process.env.MUST_DEBUG == 'true') {
                console.log('\nWhile fetching \n', mSql, '\n in table', +mTypeTable + ' ERR\n', error);
            }
            return deferred.reject(error.code);
        }
        if (results.length > 0) {
            return deferred.resolve(results);
        }
        return deferred.resolve(false);

    });
    return deferred.promise;

};
module.exports = {
    getMembershipInfo: getMembershipInfo
};

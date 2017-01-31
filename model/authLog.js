const authLogSchema = require("schema/mysql/authLog");
const authLogTable = authLogSchema.tableName;
const authLogFieldmap = authLogSchema.fieldMap;
const config = global.baseConfig;
const mySqlConnection = config.mySqlConnection;
const mysql = require("mysql");
const Q = require("q");
const mConstants = config.constants;

const getAuthLogInfo = function (filters, informationRequired, mustFetchAll) {
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
            if (authLogFieldmap.hasOwnProperty(informationRequired[idx])) {
                if (informationRequired[idx] == authLogFieldmap.id) {
                    reqFields.push("HEX(" + authLogFieldmap.id + ") AS " + authLogFieldmap.id);
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
        for (let idx in authLogFieldmap) {
            if (authLogFieldmap.hasOwnProperty(idx)) {
                if (authLogFieldmap[idx] == authLogFieldmap.id) {
                    reqFields.push("HEX(" + authLogFieldmap.id + ") AS " + authLogFieldmap.id);
                } else {
                    reqFields.push("`" + authLogFieldmap[idx] + "`");
                }
            }
        }
    }
    if (reqFields.length > 0) {
        reqFields = reqFields.join(",");
    } else {
        reqFields = "HEX(" + authLogFieldmap.id + ") AS " + authLogFieldmap.id;
    }
    let mSql = "SELECT " + reqFields + " FROM `" + authLogTable + "` WHERE ";

    let bindParams = [];
    let queryParts = [];

    if (filters[authLogFieldmap.id]) {
        if (filters[authLogFieldmap.id].length % 2) {
            deferred.reject(messages.errors.eng.violation.THE_ID_IS_INVALID.customMessage);
            return deferred.promise;
        }
        queryParts.push("`" + authLogFieldmap.id + "`=?");
        bindParams.push(new Buffer(filters[authLogFieldmap.id], 'hex'));
    }

    if (filters[authLogFieldmap.entityId]) {
        if (filters[authLogFieldmap.entityId].length % 2) {
            deferred.reject(messages.errors.eng.violation.THE_ID_IS_INVALID.customMessage);
            return deferred.promise;
        }
        queryParts.push("`" + authLogFieldmap.entityId + "`=?");
        bindParams.push(new Buffer(filters[authLogFieldmap.entityId], 'hex'));
    }
    if (filters[authLogFieldmap.intId]) {
        queryParts.push("`" + authLogFieldmap.intId + "`=?");
        bindParams.push(filters[authLogFieldmap.intId]);
    }
    if (filters[authLogFieldmap.entityName]) {
        queryParts.push("`" + authLogFieldmap.entityName + "`=?");
        bindParams.push(filters[authLogFieldmap.entityName]);
    }
    if (filters[authLogFieldmap.action]) {
        queryParts.push("`" + authLogFieldmap.action + "`=?");
        bindParams.push(filters[authLogFieldmap.action]);
    }
    if (bindParams.length > 0) {
        mSql = mSql + queryParts.join(" AND ");
        mSql = mysql.format(mSql, bindParams);
    } else {
        mSql = "SELECT " + reqFields + " FROM `" + authLogTable;
    }

    mySqlConnection.query(mSql, function (error, results, fields) {
        if (error) {
            if (process.env.MUST_DEBUG == 'true') {
                console.log('\nWhile fetching \n', mSql, '\n in table', +authLogTable + ' ERR\n', error);
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
const save = function (authLogInfoObject) {
    'use strict';
    //

    let insertionQuery = `INSERT INTO \`${authLogTable}\` `;
    let fieldsToInsert = [];
    let inserts = [];
    let placeHolders = [];
    fieldsToInsert.push("`" + authLogFieldmap.id + "`");
    fieldsToInsert.push("`" + authLogFieldmap.intId + "`");
    placeHolders.push("?");
    inserts.push("NULL");
    //
    if (authLogInfoObject.entityId) {
        fieldsToInsert.push("`" + authLogFieldmap.entityId + "`");
        placeHolders.push("?");
        inserts.push(new Buffer(authLogInfoObject.entityId, 'hex'));
    }
    if (authLogInfoObject.entityName) {
        fieldsToInsert.push("`" + authLogFieldmap.entityName + "`");
        placeHolders.push("?");
        inserts.push(authLogInfoObject.entityName);
    }
    if (authLogInfoObject.action) {
        fieldsToInsert.push("`" + authLogFieldmap.action + "`");
        placeHolders.push("?");
        inserts.push(authLogInfoObject.action);
    }
    //
    fieldsToInsert.push("`" + authLogFieldmap.createdOn + "`");
    placeHolders.push("NULL");
    //
    fieldsToInsert.push("`" + authLogFieldmap.updatedOn + "`");
    placeHolders.push("NULL");
    //
    let fieldsSpecificationString = "(" + fieldsToInsert.join(",") + ")";
    insertionQuery = insertionQuery + fieldsSpecificationString + " VALUES(ordered_uuid(uuid())," + placeHolders.join(",") + ") ";
    let deferred = Q.defer();
    let mQuery = mysql.format(insertionQuery, inserts);

    mySqlConnection.beginTransaction(function (err) {
        if (err) {
            return deferred.reject(err.message || err.code + ' ' + err.message);
        }
        mySqlConnection.query(mQuery, function (err, result) {
            if (process.env.MUST_DEBUG == 'true') {
                console.log('\nWhile inserting \n', mQuery, '\n', inserts, ' \nin ' + authLogTable + ' ERR\n', err);
            }
            if (err) {
                return mySqlConnection.rollback(function () {
                    return deferred.reject(err.message || err.code + ' ' + err.message);
                });
            }
            mySqlConnection.commit(function (err) {
                if (err) {
                    return mySqlConnection.rollback(function () {
                        return deferred.reject(err.message || err.code + ' ' + err.message);
                    });
                }
                return deferred.resolve(true)
            });
        })
    });
    return deferred.promise;
};
module.exports = {
    save: save,
    getAuthLogInfo: getAuthLogInfo
};

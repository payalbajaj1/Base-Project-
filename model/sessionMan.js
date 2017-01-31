"use strict";
const sessionManSchema = require("schema/mysql/sessionMan");
const sessionManTable = sessionManSchema.tableName;

const sessionManFieldmap = sessionManSchema.fieldMap;
const config = global.baseConfig;
const authConfig = config.auth;
const validScopes = authConfig.validScopes;
const mySqlConnection = config.mySqlConnection;
const mysql = require("mysql");
const Q = require("q");
const mConstants = config.constants;
const commonFunctions = require("Utils/CommonFunctions");
const startSession = function (sessionData) {
    let sessionKey = commonFunctions.generatePlainPassword(32);
    let allowMultipleSessions = false;
    let fieldsToInsert = [];
    let inserts = [];
    let placeHolders = [];
    let insertionQuery = `INSERT INTO \`${sessionManTable}\` `;
    fieldsToInsert.push("`" + sessionManFieldmap.id + "`");
    //
    fieldsToInsert.push("`" + sessionManFieldmap.sessionKey + "`");
    placeHolders.push("?");
    inserts.push(sessionKey);
    //
    fieldsToInsert.push("`" + sessionManFieldmap.entityId + "`");
    placeHolders.push("?");
    inserts.push(new Buffer(sessionData.entityId, 'hex'));
    //
    fieldsToInsert.push("`" + sessionManFieldmap.valid + "`");
    placeHolders.push("?");
    inserts.push(sessionData.valid);
    //
    fieldsToInsert.push("`" + sessionManFieldmap.expiresOn + "`");
    placeHolders.push("?");
    inserts.push(sessionData.expiresOn);
    //
    fieldsToInsert.push("`" + sessionManFieldmap.scope + "`");
    placeHolders.push("?");
    let scope = 'ANONYMOUS';
    switch (authConfig.validScopes[sessionData.scope]) {
        case validScopes.A:
            scope = 'A';
            break;
        case validScopes.B:
            scope = 'B';
            break;
        case validScopes.C:
            scope = 'C';
        case validScopes.D:
            scope = 'D';
            break;
        case validScopes.Z:
            scope = 'Z';
            break;
    }
    inserts.push(scope);
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
                console.log('\nWhile inserting \n', mQuery, '\n', inserts, ' \nin ' + sessionManTable + ' ERR\n', err);
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
                if (process.env.MUST_DEBUG == 'true') {
                    console.log('\nWhile inserting \n', mQuery, '\n SUCCESS \nin ' + sessionManTable + ' \n', result);
                }
                return deferred.resolve(sessionKey)
            });
        })
    });
    return deferred.promise;

};
const getSessions = function (filters, informationRequired, mustFetchAll) {
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
            if (sessionManFieldmap.hasOwnProperty(informationRequired[idx])) {
                if (informationRequired[idx] == sessionManFieldmap.id) {
                    reqFields.push("HEX(" + sessionManFieldmap.id + ") AS " + sessionManFieldmap.id);
                } else {
                    reqFields.push("`" + informationRequired[idx] + "`");
                }
                if (informationRequired[idx] == sessionManFieldmap.entityId) {
                    reqFields.push("HEX(" + sessionManFieldmap.entityId + ") AS " + sessionManFieldmap.entityId);
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
        for (let idx in sessionManFieldmap) {
            if (sessionManFieldmap.hasOwnProperty(idx)) {
                if (sessionManFieldmap[idx] == sessionManFieldmap.id) {
                    reqFields.push("HEX(" + sessionManFieldmap.id + ") AS " + sessionManFieldmap.id);
                    continue;
                }
                if (sessionManFieldmap[idx] == sessionManFieldmap.entityId) {
                    reqFields.push("HEX(" + sessionManFieldmap.entityId + ") AS " + sessionManFieldmap.entityId);
                    continue;
                }
                reqFields.push("`" + sessionManFieldmap[idx] + "`");

            }
        }
    }
    if (reqFields.length > 0) {
        reqFields = reqFields.join(",");
    } else {
        reqFields = "HEX(" + sessionManFieldmap.id + ") AS " + sessionManFieldmap.id;
    }
    let mSql = "SELECT " + reqFields + " FROM `" + sessionManTable + "` WHERE ";

    let bindParams = [];
    let queryParts = [];
    if (filters[sessionManFieldmap.id]) {
        if (filters[sessionManFieldmap.id].length % 2) {
            deferred.reject(messages.errors.eng.violation.THE_ID_IS_INVALID.customMessage);
            return deferred.promise;
        }
        queryParts.push("`" + sessionManFieldmap.id + "`=?");
        bindParams.push(new Buffer(filters[sessionManFieldmap.id], 'hex'));
    }

    if (filters[sessionManFieldmap.entityId]) {
        queryParts.push("`" + sessionManFieldmap.entityId + "`=?");
        bindParams.push(new Buffer(filters[sessionManFieldmap.entityId], 'hex'));
    }
    if (filters.hasOwnProperty(sessionManFieldmap.valid) && filters[sessionManFieldmap.valid] == 0 || filters[sessionManFieldmap.valid] == 1) {
        queryParts.push("`" + sessionManFieldmap.valid + "`=?");
        bindParams.push(filters[sessionManFieldmap.valid]);
    }
    if (filters[sessionManFieldmap.sessionKey]) {
        queryParts.push("`" + sessionManFieldmap.sessionKey + "` = ?");
        bindParams.push(filters[sessionManFieldmap.sessionKey]);
    }
    if (filters[sessionManFieldmap.expiresOn]) {
        queryParts.push("`" + sessionManFieldmap.expiresOn + "` <= ?");
        bindParams.push(filters[sessionManFieldmap.expiresOn]);
    }
    if (filters[sessionManFieldmap.createdOn]) {
        queryParts.push("`" + sessionManFieldmap.createdOn + "` <= ?");
        bindParams.push(filters[sessionManFieldmap.createdOn]);
    }
    if (filters[sessionManFieldmap.scope]) {
        queryParts.push("`" + sessionManFieldmap.scope + "`=?");
        bindParams.push(filters[sessionManFieldmap.scope]);
    }

    if (bindParams.length > 0) {
        mSql = mSql + queryParts.join(" AND ");
        mSql = mysql.format(mSql, bindParams);
    } else {
        mSql = "SELECT " + reqFields + " FROM `" + sessionManTable;
    }

    mySqlConnection.query(mSql, function (error, results, fields) {
        if (error) {
            if (process.env.MUST_DEBUG == 'true') {
                console.log('\nWhile fetching \n', mSql, '\n in table', +sessionManTable + ' ERR\n', error);
            }
            return deferred.reject(error.message || error.code + ' ' + error.message);
        }
        if (results.length > 0) {
            return deferred.resolve(results);
        }
        return deferred.resolve(false);

    });
    return deferred.promise;

};

const update = function (sessionManUUID, dataToUpdate, entityId) {
    'use strict';
    let fieldsToUpdate = [];
    let placeholderReplacements = [];

    if (dataToUpdate.hasOwnProperty(sessionManFieldmap.valid) && dataToUpdate[sessionManFieldmap.valid] == 0 || dataToUpdate[sessionManFieldmap.valid] == 1) {
        fieldsToUpdate.push("`" + sessionManFieldmap.valid + "`=?");
        placeholderReplacements.push(dataToUpdate.valid);
    }
    //
    fieldsToUpdate.push("`" + sessionManFieldmap.updatedOn + "`=NULL");
    //
    let updationQuery = `UPDATE \`${sessionManTable}\` SET `;
    if (sessionManUUID) {
        updationQuery = updationQuery + fieldsToUpdate.join(",") + " WHERE `" + sessionManFieldmap.id + "`=?";
        placeholderReplacements.push(new Buffer(sessionManUUID, 'hex'));
    } else if (entityId) {
        updationQuery = updationQuery + fieldsToUpdate.join(",") + " WHERE `" + sessionManFieldmap.entityId + "`=?";
        placeholderReplacements.push(new Buffer(entityId, 'hex'));
    }

    let deferred = Q.defer();
    let mQuery = mysql.format(updationQuery, placeholderReplacements);

    mySqlConnection.beginTransaction(function (err) {
        if (err) {
            return deferred.reject(err.message || err.code + ' ' + err.message);
        }
        mySqlConnection.query(mQuery, function (err, result) {
            if (process.env.MUST_DEBUG == 'true') {
                console.log('\nWhile updating \n', mQuery, '\n', placeholderReplacements, ' \nin ' + sessionManTable + ' ERR\n', err);
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
    update: update,
    startSession: startSession,
    getSessions: getSessions
};

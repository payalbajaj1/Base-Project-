const notificationSchema = require("schema/mysql/notification");
const notificationTable = notificationSchema.tableName;
const notificationFieldmap = notificationSchema.fieldMap;
const config = global.baseConfig;
const mySqlConnection = config.mySqlConnection;
const mysql = require("mysql");
const Q = require("q");
const mConstants = config.constants;

const getNotificationInfo = function (filters, informationRequired, mustFetchAll) {
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
            if (notificationFieldmap.hasOwnProperty(informationRequired[idx])) {
                if (informationRequired[idx] == notificationFieldmap.id) {
                    reqFields.push("HEX(" + notificationFieldmap.id + ") AS " + notificationFieldmap.id);
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
        for (let idx in notificationFieldmap) {
            if (notificationFieldmap.hasOwnProperty(idx)) {
                if (notificationFieldmap[idx] == notificationFieldmap.id) {
                    reqFields.push("HEX(" + notificationFieldmap.id + ") AS " + notificationFieldmap.id);
                } else {
                    reqFields.push("`" + notificationFieldmap[idx] + "`");
                }
            }
        }
    }
    if (reqFields.length > 0) {
        reqFields = reqFields.join(",");
    } else {
        reqFields = "HEX(" + notificationFieldmap.id + ") AS " + notificationFieldmap.id;
    }
    let mSql = "SELECT " + reqFields + " FROM `" + notificationTable + "` WHERE ";

    let bindParams = [];
    let queryParts = [];

    if (filters[notificationFieldmap.id]) {
        if (filters[notificationFieldmap.id].length % 2) {
            deferred.reject(messages.errors.eng.violation.THE_ID_IS_INVALID.customMessage);
            return deferred.promise;
        }
        queryParts.push("`" + notificationFieldmap.id + "`=?");
        bindParams.push(new Buffer(filters[notificationFieldmap.id], 'hex'));
    }
    if (filters[notificationFieldmap.intId]) {
        queryParts.push("`" + notificationFieldmap.intId + "`=?");
        bindParams.push(filters[notificationFieldmap.intId]);
    }
    if (filters[notificationFieldmap.entityId]) {
        if (filters[notificationFieldmap.entityId].length % 2) {
            deferred.reject(messages.errors.eng.violation.THE_ID_IS_INVALID.customMessage);
            return deferred.promise;
        }
        queryParts.push("`" + notificationFieldmap.entityId + "`=?");
        bindParams.push(new Buffer(filters[notificationFieldmap.entityId], 'hex'));
    }

    if (filters[notificationFieldmap.entityName]) {
        queryParts.push("`" + notificationFieldmap.entityName + "`=?");
        bindParams.push(filters[notificationFieldmap.entityName]);
    }

    if (filters[notificationFieldmap.state]) {
        queryParts.push("`" + notificationFieldmap.state + "`=?");
        bindParams.push(filters[notificationFieldmap.state]);
    }
    if (filters[notificationFieldmap.message]) {
        queryParts.push("`" + notificationFieldmap.message + "`=?");
        bindParams.push(filters[notificationFieldmap.message]);
    }
    if (bindParams.length > 0) {
        mSql = mSql + queryParts.join(" AND ");
        mSql = mysql.format(mSql, bindParams);
    } else {
        mSql = "SELECT " + reqFields + " FROM `" + notificationTable;
    }

    mySqlConnection.query(mSql, function (error, results, fields) {
        if (error) {
            if (process.env.MUST_DEBUG == 'true') {
                console.log('\nWhile fetching \n', mSql, '\n in table', +notificationTable + ' ERR\n', error);
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
const save = function (notificationInfoObject) {
    'use strict';
    //

    let insertionQuery = `INSERT INTO \`${notificationTable}\` `;
    let fieldsToInsert = [];
    let inserts = [];
    let placeHolders = [];
    fieldsToInsert.push("`" + notificationFieldmap.id + "`");
    fieldsToInsert.push("`" + notificationFieldmap.intId + "`");
    placeHolders.push("?");
    inserts.push("NULL");
    //
    if (notificationInfoObject.entityId) {
        fieldsToInsert.push("`" + notificationFieldmap.entityId + "`");
        placeHolders.push("?");
        inserts.push(new Buffer(notificationInfoObject.entityId, 'hex'));
    }
    if (notificationInfoObject.entityName) {
        fieldsToInsert.push("`" + notificationFieldmap.entityName + "`");
        placeHolders.push("?");
        inserts.push(notificationInfoObject.entityName);
    }
    if (notificationInfoObject.state) {
        fieldsToInsert.push("`" + notificationFieldmap.state + "`");
        placeHolders.push("?");
        inserts.push(notificationInfoObject.state);
    }
    if (notificationInfoObject.message) {
        fieldsToInsert.push("`" + notificationFieldmap.message + "`");
        placeHolders.push("?");
        inserts.push(notificationInfoObject.message);
    }
    //
    fieldsToInsert.push("`" + notificationFieldmap.createdOn + "`");
    placeHolders.push("NULL");
    //
    fieldsToInsert.push("`" + notificationFieldmap.updatedOn + "`");
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
                console.log('\nWhile inserting \n', mQuery, '\n', inserts, ' \nin ' + notificationTable + ' ERR\n', err);
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
    getNotificationInfo: getNotificationInfo
};

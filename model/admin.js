const adminSchema = require("schema/mysql/admin");
const adminTable = adminSchema.tableName;
const adminFieldmap = adminSchema.fieldMap;
const config = global.baseConfig;
const mySqlConnection = config.mySqlConnection;
const commonFunctions = require("Utils/CommonFunctions");
const mnt = require("moment");
const mysql = require("mysql");
const Q = require("q");
const mConstants = config.constants;

const getAdmins = function (filters, informationRequired, mustFetchAll) {
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
            if (adminFieldmap.hasOwnProperty(informationRequired[idx])) {
                if (informationRequired[idx] == adminFieldmap.id) {
                    reqFields.push("HEX(" + adminFieldmap.id + ") AS " + adminFieldmap.id);
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
        for (let idx in adminFieldmap) {
            if (adminFieldmap.hasOwnProperty(idx)) {
                if (adminFieldmap[idx] == adminFieldmap.id) {
                    reqFields.push("HEX(" + adminFieldmap.id + ") AS " + adminFieldmap.id);
                } else {
                    reqFields.push("`" + adminFieldmap[idx] + "`");
                }
            }
        }
    }
    if (reqFields.length > 0) {
        reqFields = reqFields.join(",");
    } else {
        reqFields = "HEX(" + adminFieldmap.id + ") AS " + adminFieldmap.id;
    }
    let mSql = "SELECT " + reqFields + " FROM `" + adminTable + "` WHERE ";

    let bindParams = [];
    let queryParts = [];
    if (filters[adminFieldmap.id]) {
        if (filters[adminFieldmap.id].length % 2) {
            deferred.reject(messages.errors.eng.violation.THE_ID_IS_INVALID.customMessage);
            return deferred.promise;
        }
        queryParts.push("`" + adminFieldmap.id + "`=?");
        bindParams.push(new Buffer(filters[adminFieldmap.id], 'hex'));
    }
    if (filters[adminFieldmap.userName]) {
        queryParts.push("`" + adminFieldmap.userName + "`=?");
        bindParams.push(filters[adminFieldmap.userName]);
    }

    if (bindParams.length > 0) {
        mSql = mSql + queryParts.join(" AND ");
        mSql = mysql.format(mSql, bindParams);
    } else {
        mSql = "SELECT " + reqFields + " FROM `" + adminTable;
    }

    mySqlConnection.query(mSql, function (error, results, fields) {
        if (error) {
            return deferred.reject(error.message || error.code + ' ' + error.message);
        }
        if (results.length > 0) {
            return deferred.resolve(results);
        }
        return deferred.resolve(false);

    });
    return deferred.promise;

};
const save = function (adminInfoObject) {
    'use strict';
    //

    let insertionQuery = `INSERT INTO \`${adminTable}\` `;
    let fieldsToInsert = [];
    let inserts = [];
    let placeHolders = [];
    fieldsToInsert.push("`" + adminFieldmap.id + "`");
//    fieldsToInsert.push("`" + adminFieldmap.intId + "`");
//    placeHolders.push("?");
//    inserts.push("NULL");
    //
    if (adminInfoObject.userName) {
        fieldsToInsert.push("`" + adminFieldmap.userName + "`");
        placeHolders.push("?");
        inserts.push(adminInfoObject.userName);
    }
    if (adminInfoObject.password) {
        fieldsToInsert.push("`" + adminFieldmap.passwordHash + "`");
        placeHolders.push("?");
        inserts.push(commonFunctions.hashPasswordUsingBcrypt(adminInfoObject.password));
    }
    //
    fieldsToInsert.push("`" + adminFieldmap.createdOn + "`");
    placeHolders.push("NULL");
    //
    fieldsToInsert.push("`" + adminFieldmap.updatedOn + "`");
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
                console.log('\nWhile inserting \n', mQuery, '\n', inserts, ' \nin ' + adminTable + ' ERR\n', err);
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
const update = function (adminUUID, dataToUpdate) {
    'use strict';
    let fieldsToUpdate = [];
    let placeholderReplacements = [];
    if (dataToUpdate.password) {
        fieldsToUpdate.push("`" + adminFieldmap.password + "`=?");
        placeholderReplacements.push(commonFunctions.hashPasswordUsingBcrypt(dataToUpdate.password));
    }
    //
    fieldsToUpdate.push("`" + adminFieldmap.updatedOn + "`=NULL");
    //
    let updationQuery = `UPDATE \`${adminTable}\` SET `;
    updationQuery = updationQuery + fieldsToUpdate.join(",") + " WHERE `" + adminFieldmap.id + "`=?";
    placeholderReplacements.push(new Buffer(adminUUID, 'hex'));
    let deferred = Q.defer();
    let mQuery = mysql.format(updationQuery, placeholderReplacements);

    mySqlConnection.beginTransaction(function (err) {
        if (err) {
            return deferred.reject(err.message || err.code + ' ' + err.message);
        }
        mySqlConnection.query(mQuery, function (err, result) {
            if (process.env.MUST_DEBUG == 'true') {
                console.log('\nWhile updating \n', mQuery, '\n', placeholderReplacements, ' \nin ' + adminTable + ' ERR\n', err);
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
    getAdmins: getAdmins,
    save: save
};

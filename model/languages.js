'use strict';
const languageSchema = require("../schema/mysql/languages");
const config = global.baseConfig;
const mySqlConnection = config.mySqlConnection;
const commonFunctions = require("Utils/CommonFunctions");
const mysql = require("mysql");
const Q = require("q");
const mConstants = config.constants;

const save = function (languageInfoObject) {
    console.log('IN LANGUAGE SATE');
    let insertionQuery = `INSERT INTO \`${languageSchema.tableName}\` `;
    let fieldsToInsert = [];
    let inserts = [];
    let placeHolders = [];
    fieldsToInsert.push("`" + languageSchema.fieldMap.id + "`");
//		fieldsToInsert.push( "`" + languageSchema.fieldMap.intId + "`" );
//		placeHolders.push( "?" );
//		inserts.push( "NULL" );

    if (languageInfoObject.language) {
        fieldsToInsert.push("`" + languageSchema.fieldMap.language + "`");
        placeHolders.push("?");
        inserts.push(languageInfoObject.language);
    }
    if (languageInfoObject.defaultLanguage) {
        fieldsToInsert.push("`" + languageSchema.fieldMap.defaultLanguage + "`");
        placeHolders.push("?");
        inserts.push(1);
    } else {
        fieldsToInsert.push("`" + languageSchema.fieldMap.defaultLanguage + "`");
        placeHolders.push("?");
        inserts.push(0);
    }
    if (languageInfoObject.languageCode) {
        fieldsToInsert.push("`" + languageSchema.fieldMap.languageCode + "`");
        placeHolders.push("?");
        inserts.push(languageInfoObject.languageCode);
    }
    fieldsToInsert.push("`" + languageSchema.fieldMap.createdOn + "`");
    placeHolders.push("NULL");
    fieldsToInsert.push("`" + languageSchema.fieldMap.updatedOn + "`");
    placeHolders.push("NULL");
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
                console.log('\nWhile inserting \n', mQuery, '\n', inserts, ' \nin ' + languageSchema.tableName + ' ERR\n', err);
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
                return deferred.resolve(result)
            });
        })
    });
    return deferred.promise;
};
const getLanguages = function (filters, informationRequired, mustFetchAll) {
    'use strict';
    let deferred = Q.defer();
    if (!filters) {
        filters = {};
    }
    if (!informationRequired) {
        informationRequired = {};
    }
    let reqFields = [];
    if (mustFetchAll === true) {
        for (let idx in languageSchema.fieldMap) {
            if (languageSchema.fieldMap[idx]) {
                if (languageSchema.fieldMap[idx] == languageSchema.fieldMap.id) {
                    reqFields.push("HEX(" + languageSchema.fieldMap.id + ") AS " + languageSchema.fieldMap.id);
                } else {
                    reqFields.push("`" + languageSchema.fieldMap[idx] + "`");
                }
            }
        }
    }
    else {
        for (let idx in informationRequired) {
            if (informationRequired[idx]) {
                if (languageSchema.fieldMap[informationRequired[idx]]) {
                    if (informationRequired[idx] == languageSchema.fieldMap.id) {
                        reqFields.push("HEX(" + languageSchema.fieldMap.id + ") AS " + languageSchema.fieldMap.id);
                    } else {
                        reqFields.push("`" + informationRequired[idx] + "`");
                    }
                } else {
                    delete informationRequired[idx];
                }
            }
        }
    }

    if (reqFields.length > 0) {
        reqFields = reqFields.join(",");
    } else {
        reqFields = "HEX(" + languageSchema.fieldMap.id + ") AS " + languageSchema.fieldMap.id;
    }
    let mSql = "SELECT " + reqFields + " FROM `" + languageSchema.tableName + "` WHERE ";
    let bindParams = [];
    let queryParts = [];
    if (filters[languageSchema.fieldMap.id]) {
        if (filters[languageSchema.fieldMap.id].length % 2) {
            deferred.reject(messages.errors.eng.violation.THE_ID_IS_INVALID.customMessage);
            return deferred.promise;
        }
        queryParts.push("`" + languageSchema.fieldMap.id + "`=?");
        bindParams.push(new Buffer(filters[languageSchema.fieldMap.id], 'hex'));
    }
    if (filters[languageSchema.fieldMap.language]) {
        queryParts.push("`" + languageSchema.fieldMap.language + "`=?");
        bindParams.push(filters[languageSchema.fieldMap.language]);
    }
    if (filters[languageSchema.fieldMap.languageCode]) {
        queryParts.push("`" + languageSchema.fieldMap.languageCode + "`=?");
        bindParams.push(filters[languageSchema.fieldMap.languageCode]);
    }
    if (filters[languageSchema.fieldMap.defaultLanguage] || filters[languageSchema.fieldMap.defaultLanguage] == 0) {
        queryParts.push("`" + languageSchema.fieldMap.defaultLanguage + "`=?");
        bindParams.push(filters[languageSchema.fieldMap.defaultLanguage]);
    }

    if (bindParams.length > 0) {
        mSql = mSql + queryParts.join(" AND ");
        mSql = mysql.format(mSql, bindParams);
    } else {
        mSql = "SELECT " + reqFields + " FROM `" + languageSchema.tableName + '` ';
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
module.exports = {

    getLanguages: getLanguages,
    save: save
};
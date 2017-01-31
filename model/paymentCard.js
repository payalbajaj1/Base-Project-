const paymentCardSchema = require("schema/mysql/paymentCard");
const paymentCardTable = paymentCardSchema.tableName;
const paymentCardFieldmap = paymentCardSchema.fieldMap;
const config = global.baseConfig;
const mySqlConnection = config.mySqlConnection;
const mysql = require("mysql");
const Q = require("q");
const mConstants = config.constants;

const getPaymentCardInfo = function (filters, informationRequired, mustFetchAll) {
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
            if (paymentCardFieldmap.hasOwnProperty(informationRequired[idx])) {
                if (informationRequired[idx] == paymentCardFieldmap.id) {
                    reqFields.push("HEX(" + paymentCardFieldmap.id + ") AS " + paymentCardFieldmap.id);
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
        for (let idx in paymentCardFieldmap) {
            if (paymentCardFieldmap.hasOwnProperty(idx)) {
                if (paymentCardFieldmap[idx] == paymentCardFieldmap.id) {
                    reqFields.push("HEX(" + paymentCardFieldmap.id + ") AS " + paymentCardFieldmap.id);
                } else {
                    reqFields.push("`" + paymentCardFieldmap[idx] + "`");
                }
            }
        }
    }
    if (reqFields.length > 0) {
        reqFields = reqFields.join(",");
    } else {
        reqFields = "HEX(" + paymentCardFieldmap.id + ") AS " + paymentCardFieldmap.id;
    }
    let mSql = "SELECT " + reqFields + " FROM `" + paymentCardTable + "` WHERE ";

    let bindParams = [];
    let queryParts = [];

    if (filters[paymentCardFieldmap.id]) {
        if (filters[paymentCardFieldmap.id].length % 2) {
            deferred.reject(messages.errors.eng.violation.THE_ID_IS_INVALID.customMessage);
            return deferred.promise;
        }
        queryParts.push("`" + paymentCardFieldmap.id + "`=?");
        bindParams.push(new Buffer(filters[paymentCardFieldmap.id], 'hex'));
    }

    if (filters[paymentCardFieldmap.entityId]) {
        if (filters[paymentCardFieldmap.entityId].length % 2) {
            deferred.reject(messages.errors.eng.violation.THE_ID_IS_INVALID.customMessage);
            return deferred.promise;
        }
        queryParts.push("`" + paymentCardFieldmap.entityId + "`=?");
        bindParams.push(new Buffer(filters[paymentCardFieldmap.entityId], 'hex'));
    }
    if (filters[paymentCardFieldmap.intId]) {
        queryParts.push("`" + paymentCardFieldmap.intId + "`=?");
        bindParams.push(filters[paymentCardFieldmap.intId]);
    }
    if (filters[paymentCardFieldmap.entityName]) {
        queryParts.push("`" + paymentCardFieldmap.entityName + "`=?");
        bindParams.push(filters[paymentCardFieldmap.entityName]);
    }
    if (filters[paymentCardFieldmap.stripeCustomerId]) {
        queryParts.push("`" + paymentCardFieldmap.stripeCustomerId + "`=?");
        bindParams.push(filters[paymentCardFieldmap.stripeCustomerId]);
    }
    if (bindParams.length > 0) {
        mSql = mSql + queryParts.join(" AND ");
        mSql = mysql.format(mSql, bindParams);
    } else {
        mSql = "SELECT " + reqFields + " FROM `" + paymentCardTable;
    }

    mySqlConnection.query(mSql, function (error, results, fields) {
        if (error) {
            if (process.env.MUST_DEBUG == 'true') {
                console.log('\nWhile fetching \n', mSql, '\n in table', +paymentCardTable + ' ERR\n', error);
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
const save = function (paymentCardInfoObject) {
    'use strict';
    //

    let insertionQuery = `INSERT INTO \`${paymentCardTable}\` `;
    let fieldsToInsert = [];
    let inserts = [];
    let placeHolders = [];
    fieldsToInsert.push("`" + paymentCardFieldmap.id + "`");
    fieldsToInsert.push("`" + paymentCardFieldmap.intId + "`");
    placeHolders.push("?");
    inserts.push("NULL");
    //
    if (paymentCardInfoObject.entityId) {
        fieldsToInsert.push("`" + paymentCardFieldmap.entityId + "`");
        placeHolders.push("?");
        inserts.push(new Buffer(paymentCardInfoObject.entityId, 'hex'));
    }
    if (paymentCardInfoObject.entityName) {
        fieldsToInsert.push("`" + paymentCardFieldmap.entityName + "`");
        placeHolders.push("?");
        inserts.push(paymentCardInfoObject.entityName);
    }
    if (paymentCardInfoObject.stripeCustomerId) {
        fieldsToInsert.push("`" + paymentCardFieldmap.stripeCustomerId + "`");
        placeHolders.push("?");
        inserts.push(paymentCardInfoObject.stripeCustomerId);
    }
    //
    fieldsToInsert.push("`" + paymentCardFieldmap.createdOn + "`");
    placeHolders.push("NULL");
    //
    fieldsToInsert.push("`" + paymentCardFieldmap.updatedOn + "`");
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
                console.log('\nWhile inserting \n', mQuery, '\n', inserts, ' \nin ' + paymentCardTable + ' ERR\n', err);
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
    getPaymentCardInfo: getPaymentCardInfo
};

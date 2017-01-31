'use strict';
const messageSchema = require("../schema/mysql/messages");
const relMessageLanguageSchema = require("../schema/mysql/relMessageLanguage");
const languageSchema = require("../schema/mysql/languages");
const config = require("config");
const mySqlConnection = config.mySqlConnection;
const commonFunctions = require("Utils/CommonFunctions");
const mysql = require("mysql");
const Q = require("q");
const mConstants = config.constants;
const msg = require('../config/messages');
const save = function () {
    let insertionQuery = `INSERT INTO \`${messageSchema.tableName}\` `;
    let fieldsToInsert = [];
    let inserts = [];
    let placeHolders = [];
    fieldsToInsert.push("`" + messageSchema.fieldMap.id + "`");
//		fieldsToInsert.push( "`" + messageSchema.fieldMap.intId + "`" );
//		placeHolders.push( "?" );
//		inserts.push( "NULL" );
    fieldsToInsert.push("`" + messageSchema.fieldMap.type + "`");
    fieldsToInsert.push("`" + messageSchema.fieldMap.statusCode + "`")
    fieldsToInsert.push("`" + messageSchema.fieldMap.messageType + "`");
    fieldsToInsert.push("`" + messageSchema.fieldMap.layerType + "`");
    fieldsToInsert.push("`" + messageSchema.fieldMap.updatedOn + "`");
    fieldsToInsert.push("`" + messageSchema.fieldMap.createdOn + "`");
    let fieldsSpecificationString = "(" + fieldsToInsert.join(",") + ")";

//		*  type:-DB_NOT_INITIALIZED_PROPERLY,PLEASE_TRY_AGAIN,...
//		*  statusCode:- 400,401,...
//		*  messageType:- ERROR,SUCCESS,...,
//		*  layerType: db,notFound,....
    let insertValue = '';
    let isFrstTime = true;
    for (var messageType in msg.messages) {
        for (var layerType in msg.messages[messageType]) {
            for (var type in msg.messages[messageType][layerType]) {
                if (isFrstTime) {
                    insertValue += `(ordered_uuid(uuid()),'${type}','${msg.messages[messageType][layerType][type].statusCode}','${messageType}','${layerType}',${new Date().getTime()},${new Date().getTime()})`
                    isFrstTime = false;
                } else {
                    insertValue += `,(ordered_uuid(uuid()),'${type}','${msg.messages[messageType][layerType][type].statusCode}','${messageType}','${layerType}',${new Date().getTime()},${new Date().getTime()})`
                }
            }
        }
    }
    insertionQuery = insertionQuery + fieldsSpecificationString + " VALUES " + insertValue;
    let deferred = Q.defer();
    mySqlConnection.beginTransaction(function (err) {
        if (err) {
            return deferred.reject(err.message || err.code + ' ' + err.message);
        }
        mySqlConnection.query(insertionQuery, function (err, result) {
            if (process.env.MUST_DEBUG == 'true') {
                console.log('\nWhile inserting \n', insertionQuery, '\n', inserts, ' \nin ' + messageSchema.tableName + ' ERR\n', err);
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
const getMessages = function (filters, informationRequired, mustFetchAll) {
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
        for (let idx in messageSchema.fieldMap) {
            if (messageSchema.fieldMap[idx]) {
                if (messageSchema.fieldMap[idx] == messageSchema.fieldMap.id) {
                    reqFields.push("HEX(msg." + messageSchema.fieldMap.id + ") AS " + messageSchema.fieldMap.id);
                } else {
                    reqFields.push('msg.`' + messageSchema.fieldMap[idx] + "`");
                }
            }
        }
        reqFields.push("rel.`" + relMessageLanguageSchema.fieldMap.customMessage + "`");
        reqFields.push("ln.`" + languageSchema.fieldMap.languageCode + "`");
    }
    else {
        for (let idx in informationRequired) {
            if (informationRequired[idx]) {
                if (messageSchema.fieldMap[informationRequired[idx]]) {
                    if (informationRequired[idx] == messageSchema.fieldMap.id) {
                        reqFields.push(messageSchema.tableName + ".HEX(" + messageSchema.fieldMap.id + ") AS " + messageSchema.fieldMap.id);
                    } else {
                        reqFields.push(`${messageSchema.tableName}.\`${informationRequired[idx]}\``);
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
        reqFields = "HEX(" + messageSchema.fieldMap.id + ") AS " + messageSchema.fieldMap.id;
    }
    let mSql = "SELECT " + reqFields + " FROM `" + messageSchema.tableName + "` msg "
        + " left join `" + relMessageLanguageSchema.tableName + "` rel on `" + "msg`.id = rel.messageID "
        + " left join `" + languageSchema.tableName + "`ln on rel.languageID  = ln.id WHERE ";
    let bindParams = [];
    let queryParts = [];
    if (filters[messageSchema.fieldMap.id]) {
        if (filters[messageSchema.fieldMap.id].length % 2) {
            deferred.reject(messages.errors.eng.violation.THE_ID_IS_INVALID.customMessage);
            return deferred.promise;
        }
        queryParts.push("`" + messageSchema.fieldMap.id + "`=?");
        bindParams.push(new Buffer(filters[messageSchema.fieldMap.id], 'hex'));
    }
    if (filters[messageSchema.fieldMap.type]) {
        queryParts.push("`" + messageSchema.fieldMap.type + "`=?");
        bindParams.push(filters[messageSchema.fieldMap.type]);
    }
    if (filters[messageSchema.fieldMap.messageType]) {
        queryParts.push("`" + messageSchema.fieldMap.messageType + "`=?");
        bindParams.push(filters[messageSchema.fieldMap.messageType]);
    }
    if (filters[messageSchema.fieldMap.layerType]) {
        queryParts.push("`" + messageSchema.fieldMap.layerType + "`=?");
        bindParams.push(filters[messageSchema.fieldMap.layerType]);
    }
    if (filters[messageSchema.fieldMap.statusCode] || filters[messageSchema.fieldMap.statusCode] == 0) {
        queryParts.push("`" + messageSchema.fieldMap.statusCode + "`=?");
        bindParams.push(filters[messageSchema.fieldMap.statusCode]);
    }
    if (bindParams.length > 0) {
        mSql = mSql + queryParts.join(" AND ");
        mSql = mysql.format(mSql, bindParams);
    } else {
        mSql = "SELECT " + reqFields + " FROM `" + messageSchema.tableName + "` msg "
            + " left join `" + relMessageLanguageSchema.tableName + "` rel on `" + "msg`.id = rel.messageID "
            + " left join `" + languageSchema.tableName + "`ln on rel.languageID  = ln.id ";
    }
    console.log(mSql, 'GET DATAAAA');
    mySqlConnection.query(mSql, function (error, results, fields) {
        if (error) {
            return deferred.reject(error.message || error.code + ' ' + error.message);
        }

        if (results.length) {
            return deferred.resolve(results);
        }
        return deferred.resolve(false);

    });
    return deferred.promise;

};
const checkMessagesExistOrNot = function (messageUUID, languageUUID) {
    'use strict';
    let deferred = Q.defer();
    let reqFields = [];
    reqFields = "HEX(" + relMessageLanguageSchema.fieldMap.id + ") AS " + relMessageLanguageSchema.fieldMap.id;
    let mSql = "SELECT " + reqFields + " FROM `" + relMessageLanguageSchema.tableName + "` WHERE "
    let bindParams = [];
    let queryParts = [];
    queryParts.push("`" + relMessageLanguageSchema.fieldMap.messageID + "`=?");
    bindParams.push(new Buffer(messageUUID, 'hex'));
    queryParts.push("`" + relMessageLanguageSchema.fieldMap.languageID + "`=?");
    bindParams.push(new Buffer(languageUUID, 'hex'));
    if (bindParams.length > 0) {
        mSql = mSql + queryParts.join(" AND ");
        mSql = mysql.format(mSql, bindParams);
    }
    mySqlConnection.query(mSql, function (error, results, fields) {
        if (error) {
            return deferred.reject(error.message || error.code + ' ' + error.message);
        }

        if (results.length) {
            return deferred.resolve(true);
        }
        return deferred.resolve(false);

    });
    return deferred.promise;

};
const updateMessages = function (messageUUID, languageUUID, dataToUpdate) {
    'use strict';
    let fieldsToUpdate = [];
    let placeholderReplacements = [];
    if (dataToUpdate.customMessage) {
        fieldsToUpdate.push("`" + relMessageLanguageSchema.fieldMap.customMessage + "`=?");
        placeholderReplacements.push(dataToUpdate.customMessage);
    }
    fieldsToUpdate.push("`" + relMessageLanguageSchema.fieldMap.updatedOn + "`=" + new Date().getTime());
    let updationQuery = `UPDATE \`${relMessageLanguageSchema.tableName}\` SET `;
    updationQuery += fieldsToUpdate.join(",") + " WHERE `" + relMessageLanguageSchema.fieldMap.messageID + "` = ? ";
    placeholderReplacements.push(new Buffer(messageUUID, 'hex'));
    updationQuery += ' and `' + relMessageLanguageSchema.fieldMap.languageID + "` = ? "
    placeholderReplacements.push(new Buffer(languageUUID, 'hex'));
    let deferred = Q.defer();
    let mQuery = mysql.format(updationQuery, placeholderReplacements);
    console.log(mQuery, 'UPDATE MESSAGE QUERY--->>>');
    mySqlConnection.beginTransaction(function (err) {
        if (err) {
            return deferred.reject(err.message || err.code + ' ' + err.message);
        }
        mySqlConnection.query(mQuery, function (err, result) {
            if (process.env.MUST_DEBUG == 'true') {
                console.log('\nWhile updating \n', mQuery, '\n', placeholderReplacements, ' \nin ' + relMessageLanguageSchema.tableName + ' ERR\n', err);
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
const insertMessage = function (messageUUID, languageUUID, dataToSave) {
    let insertionQuery = `INSERT INTO \`${messageSchema.tableName}\` `;
    let fieldsToInsert = [];
    let inserts = [];
    let placeHolders = [];
    fieldsToInsert.push("`" + messageSchema.fieldMap.id + "`");
    if (dataToSave.customMessage) {
        fieldsToInsert.push("`" + relMessageLanguageSchema.fieldMap.customMessage + "`");
        placeHolders.push("?");
        inserts.push(dataToSave.customMessage);
    }
    fieldsToInsert.push("`" + relMessageLanguageSchema.fieldMap.languageID + "`");
    placeHolders.push("?");
    inserts.push(new Buffer(languageUUID, 'hex'));
    fieldsToInsert.push("`" + relMessageLanguageSchema.fieldMap.messageID + "`");
    placeHolders.push("?");
    inserts.push(new Buffer(messageUUID, 'hex'));
    fieldsToInsert.push("`" + relMessageLanguageSchema.fieldMap.createdOn + "`");
    placeHolders.push(new Date().getTime());
    fieldsToInsert.push("`" + relMessageLanguageSchema.fieldMap.updatedOn + "`");
    placeHolders.push(new Date().getTime());
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
                console.log('\nWhile inserting \n', mQuery, '\n', inserts, ' \nin ' + messageSchema.tableName + ' ERR\n', err);
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
const saveMessages = function (data, languageUUID) {
    let insertionQuery = `INSERT INTO \`${relMessageLanguageSchema.tableName}\` `;
    let fieldsToInsert = [];
    let inserts = [];
    let placeHolders = [];
    fieldsToInsert.push("`" + relMessageLanguageSchema.fieldMap.id + "`");
    fieldsToInsert.push("`" + relMessageLanguageSchema.fieldMap.customMessage + "`");
    fieldsToInsert.push("`" + relMessageLanguageSchema.fieldMap.languageID + "`");
    fieldsToInsert.push("`" + relMessageLanguageSchema.fieldMap.messageID + "`")
    fieldsToInsert.push("`" + messageSchema.fieldMap.updatedOn + "`");
    fieldsToInsert.push("`" + messageSchema.fieldMap.createdOn + "`");
    let fieldsSpecificationString = "(" + fieldsToInsert.join(",") + ")";
    let insertValue = '';
    let isFrstTime = true, bindParams = [];
    for (var messageType in msg.messages) {
        for (var layerType in msg.messages[messageType]) {
            for (var type in msg.messages[messageType][layerType]) {
                for (var k in data) {

//										data=messageData[k];
                    if (data[k].type && data[k].type.toString() == type && data[k].type && data[k].messageType.toString() == messageType && data[k].layerType && data[k].layerType.toString() == layerType) {

                        if (isFrstTime) {
                            insertValue += "(ordered_uuid(uuid()),'" + msg.messages[messageType][layerType][type].customMessage + "',?,?," + new Date().getTime() + "," + new Date().getTime() + ")"
                            isFrstTime = false;
                        } else {
                            insertValue += ",(ordered_uuid(uuid()),'" + msg.messages[messageType][layerType][type].customMessage + "',?,?," + new Date().getTime() + "," + new Date().getTime() + ")"
                        }
                        bindParams.push(new Buffer(languageUUID, 'hex'));
                        bindParams.push(new Buffer(data[k].id, 'hex'));
                        delete data[k];
                        break;
                    }
                }
            }
        }
    }
    insertionQuery = insertionQuery + fieldsSpecificationString + " VALUES " + insertValue;
    let mQuery = mysql.format(insertionQuery, bindParams);
    let deferred = Q.defer();
    mySqlConnection.beginTransaction(function (err) {
        if (err) {
            return deferred.reject(err.message || err.code + ' ' + err.message);
        }
        mySqlConnection.query(mQuery, function (err, result) {
            if (process.env.MUST_DEBUG == 'true') {
                console.log('\nWhile inserting \n', insertionQuery, '\n', inserts, ' \nin ' + messageSchema.tableName + ' ERR\n', err);
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
    saveMessages: saveMessages,
    checkMessagesExistOrNot: checkMessagesExistOrNot,
    insertMessage: insertMessage,
    getMessages: getMessages,
    save: save,
    updateMessages: updateMessages
};

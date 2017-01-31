'use strict';
const config = global.baseConfig;
const mySqlConnection = config.mySqlConnection;
const tableName = 'languages';
const collate = 'utf8_unicode_ci';
const charset = 'utf8';
const engine = 'InnoDB';
const fieldMap = {
    id: 'id',
    intId: 'intId',
    language: 'language',
    defaultLanguage: 'defaultLanguage',
    languageCode: 'languageCode',
    createdOn: 'createdOn',
    updatedOn: 'updatedOn'

};
const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (
    \`${fieldMap.id}\` binary(16) NOT NULL PRIMARY KEY,
    \`${fieldMap.intId}\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`${fieldMap.language}\` VARCHAR(200) DEFAULT NULL,
    \`${fieldMap.defaultLanguage}\` BIT DEFAULT 0,
    \`${fieldMap.languageCode}\` VARCHAR(3) DEFAULT NULL,
    \`${fieldMap.createdOn}\` BIGINT UNSIGNED DEFAULT NULL,
    \`${fieldMap.updatedOn}\` BIGINT UNSIGNED DEFAULT NULL,
    UNIQUE KEY maskId (${fieldMap.intId}),
    CONSTRAINT ${tableName}_language_unq UNIQUE (${fieldMap.languageCode},${fieldMap.language})
    ) ENGINE=${engine} CHARACTER SET ${charset} COLLATE ${collate};`;

const insertionTrigger = `
create trigger tr_b_ins_${tableName} before insert on ${tableName} for each row
begin
    if (new.createdOn is null)
    then
    set new.createdOn = unix_timestamp();
    end if;
end;
`;
const updationTrigger = `
CREATE TRIGGER tr_b_update_${tableName} BEFORE UPDATE ON ${tableName}
 FOR EACH ROW
 BEGIN
     IF (NEW.updatedOn is null) THEN
         SET NEW.updatedOn = unix_timestamp();
     END IF;
 END;
`;
const dropInsertionTrigger = `DROP TRIGGER IF EXISTS tr_b_ins_${tableName};`;
const dropUpdationTrigger = `DROP TRIGGER IF EXISTS tr_b_update_${tableName};`;
const prep = function () {
    if (process.env.MUST_DEBUG == 'true') {
        console.log('\n*******\n prepping ' + tableName + '\n*******\n');
    }
    mySqlConnection.beginTransaction(function (err) {
        if (err) {
            throw err;
        }
        mySqlConnection.query(createTable, function (err, result) {
            if (err) {
                return mySqlConnection.rollback(function () {
                    throw err;
                });
            }
            mySqlConnection.query(dropInsertionTrigger, function (err, result) {
                if (err) {
                    return mySqlConnection.rollback(function () {
                        throw err;
                    });
                }
                mySqlConnection.query(dropUpdationTrigger, function (err, result) {
                    if (err) {
                        return mySqlConnection.rollback(function () {
                            throw err;
                        });
                    }
                    mySqlConnection.query(insertionTrigger, function (err, result) {
                        if (err) {
                            return mySqlConnection.rollback(function () {
                                throw err;
                            });
                        }
                        mySqlConnection.query(updationTrigger, function (err, result) {
                            if (err) {
                                return mySqlConnection.rollback(function () {
                                    throw err;
                                });
                            }
                            mySqlConnection.commit(function (err) {
                                if (err) {
                                    return mySqlConnection.rollback(function () {
                                        throw err;
                                    });
                                }
                                if (process.env.MUST_DEBUG == 'true') {
                                    console.log('\nSuccess in ' + tableName + ' table:\n');
                                }
                            });
                        });
                    });
                });
            });
        });
    });
};
if (process.env['PREPARE_TABLES'] == 'true' && (process.env['DB_TO_USE'] == "MYSQL" || process.env['DB_TO_USE'] == "MYSQL_AND_MONGODB")) {
    prep();
}
/**
 * @Note: Please set messages according to default Language and In whole table/Collection there should be only one default Language
 * @param mycbc
 */
const insertLanguagesAndMessages = function (mycbc) {
    "use strict";
    const languageModel = require("model/languages");
    const messagesModel = require("model/messages");
    const Boom = require("boom");
    let fetchPromise = languageModel.getLanguages({defaultLanguage: 1}, false, true);
    fetchPromise.then(function (resp) {
        if (resp == false) {
            let creationPromise = languageModel.save({
                language: 'English',
                defaultLanguage: '1',
                languageCode: 'eng',
            });
            creationPromise.then(function (r) {
                fetchPromise = languageModel.getLanguages({defaultLanguage: 1}, false, true);
                fetchPromise.then(function (r) {
                    let languageID = r[0].id;
                    messagesModel.save()
                        .then(function (r) {
                            messagesModel.getMessages({}, false, true)
                                .then(function (r) {
                                    messagesModel.saveMessages(r, languageID)
                                        .then(function (r) {
                                            if (r == true) {
                                                messagesModel.getMessages({}, false, true)
                                                    .then(function (r) {
                                                        setValueMessage(r, mycbc);
                                                    });
                                            } else {
                                                return mycbc(r);
                                            }
                                        });
                                });
                        });
                });

            }).fail(function (err) {
                return mycbc(Boom.create(400, err));
            });
        } else {
            messagesModel.getMessages({}, false, true)
                .then(function (r) {
                    if (!r) {
                        messagesModel.save()
                            .then(function (r) {
                                messagesModel.getMessages({}, false, true)
                                    .then(function (r) {
                                        messagesModel.saveMessages(r, resp[0].id)
                                            .then(function (r) {
                                                if (r) {
                                                    messagesModel.getMessages({}, false, true)
                                                        .then(function (r) {
                                                            setValueMessage(r, mycbc);
                                                        });
                                                } else {
                                                    return mycbc(r);
                                                }
                                            });
                                    })
                            })
                    } else {
                        setValueMessage(r, mycbc);
                    }
                })
        }

    }).fail(function (err) {
        return mycbc(Boom.create(400, err));
    });
};

global.setValueMessage = function (data, mycbc) {
    global.message = {}
    for (var key in data) {
        if (data[key].messageType) {
            if (!message[data[key].messageType]) {
                message[data[key].messageType] = {};
            }
        }
        if (data[key].languageCode) {
            if (!message[data[key].messageType][data[key].languageCode]) {
                message[data[key].messageType][data[key].languageCode] = {};
            }
        }
        if (data[key].layerType) {
            if (!message[data[key].messageType][data[key].languageCode][data[key].layerType]) {
                message[data[key].messageType][data[key].languageCode][data[key].layerType] = {};
            }
        }
        if (data[key].type) {
            if (!message[data[key].messageType][data[key].languageCode][data[key].layerType][data[key].type]) {
                message[data[key].messageType][data[key].languageCode][data[key].layerType][data[key].type] = {};
                message[data[key].messageType][data[key].languageCode][data[key].layerType][data[key].type]['statusCode'] = data[key].statusCode;
                message[data[key].messageType][data[key].languageCode][data[key].layerType][data[key].type]['customMessage'] = data[key].customMessage;
                message[data[key].messageType][data[key].languageCode][data[key].layerType][data[key].type]['type'] = data[key].type;
            }
        }
    }
    return mycbc('success in message creation');
};
module.exports = {
    insertLanguagesAndMessages: insertLanguagesAndMessages,
    tableName: tableName,
    fieldMap: fieldMap
};

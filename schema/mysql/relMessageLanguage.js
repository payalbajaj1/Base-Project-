'use strict';
const config = global.baseConfig;
const mySqlConnection = config.mySqlConnection;
const tableName = 'relMessageLanguages';
const collate = 'utf8_unicode_ci';
const charset = 'utf8';
const engine = 'InnoDB';
const bt = require('schema/mysql/languages');
const fieldMap = {
    id: 'id',
    intId: 'intId',
    languageID: 'languageID',
    messageID: 'messageID',
    customMessage: 'customMessage',
    createdOn: 'createdOn',
    updatedOn: 'updatedOn'

};
const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (
    \`${fieldMap.id}\` binary(16) NOT NULL PRIMARY KEY,
    \`${fieldMap.intId}\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    \`${fieldMap.languageID}\` binary(16) DEFAULT NULL,
    \`${fieldMap.messageID}\` binary(16) DEFAULT NULL,
    \`${fieldMap.customMessage}\` VARCHAR(200) DEFAULT NULL,
    \`${fieldMap.createdOn}\` BIGINT UNSIGNED DEFAULT NULL,
    \`${fieldMap.updatedOn}\` BIGINT UNSIGNED DEFAULT NULL,
    UNIQUE KEY maskId (${fieldMap.intId}),
    CONSTRAINT FOREIGN KEY (${fieldMap.languageID}) REFERENCES languages(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT FOREIGN KEY (${fieldMap.messageID}) REFERENCES messages(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
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
                                bt.insertLanguagesAndMessages(function (e, d) {
                                    "use strict";
                                    console.log('in Language and Message creation e, d', e, d);
                                });
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

if (process.env['PREPARE_TABLES'] == 'true' && (process.env['DB_TO_USE'] == "MYSQL" || process.env['DB_TO_USE'] == "MYSQL_AND_MONGODB")) {
    bt.insertLanguagesAndMessages(function (e, d) {
        "use strict";
        console.log('in Language and Message creation e, d', e, d);
    });
}
module.exports = {
    tableName: tableName,
    fieldMap: fieldMap
};
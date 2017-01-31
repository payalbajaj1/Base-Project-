'use strict';
const config = global.baseConfig;
const mySqlConnection = config.mySqlConnection;
const tableName = 'membershipType';
const charset = "utf8";
const engine = "InnoDB";
const collate = "utf8_unicode_ci";
/**
 * prefer to store ammountValue in smallest unit of currency
 * For Example:
 * If Dollar is the currenct store the value in cents,
 * this makes easy to handle values
 * we dont need to handle decimal values
 */
const fieldMap = {
    id: "id",
    intId: "intId",
    name: "name",
    ammountValue: "ammountValue",
    ammountMeasuredInUnit: "ammountMeasuredInUnit",
    currency: "currency",
    enabled: "enabled",
    createdOn: "createdOn",
    updatedOn: "updatedOn"

};
const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (
    ${fieldMap.id} binary(16) NOT NULL PRIMARY KEY,
    ${fieldMap.intId} BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ${fieldMap.name} VARCHAR(200) NOT NULL,
    ${fieldMap.ammountValue} BIGINT UNSIGNED NOT NULL,
    ${fieldMap.ammountMeasuredInUnit} VARCHAR(200) NOT NULL,
    ${fieldMap.currency} VARCHAR(50) NOT NULL,
    ${fieldMap.enabled} BOOLEAN DEFAULT 1,
    ${fieldMap.createdOn} BIGINT UNSIGNED NOT NULL,
    ${fieldMap.updatedOn} BIGINT UNSIGNED NOT NULL,
    UNIQUE KEY maskId (${fieldMap.intId}),
    CONSTRAINT ${tableName}uc_name UNIQUE (${fieldMap.name})
    ) ENGINE=${engine} CHARACTER SET ${charset} COLLATE ${collate};`;
let values = [];
for (let lvl in config.constants.membershipTypes) {
    if (config.constants.membershipTypes.hasOwnProperty(lvl)) {
        let memberShipInfo = config.constants.membershipTypes[lvl];
        values.push(`(ordered_uuid(uuid()),NULL,'${memberShipInfo.name}','${memberShipInfo.ammountValue}','${memberShipInfo.ammountMeasuredInUnit}','${memberShipInfo.currency}',true,NULL,NULL)`);
    }

}
values = values.join(",");
const initialiseMembershiptTypes = `INSERT IGNORE INTO ${tableName} VALUES ${values};`;
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
        console.log('\n*******\nprepping ' + tableName + '\n*******\n');
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
                            mySqlConnection.query(initialiseMembershiptTypes, function (err, result) {
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
    });
};
if (process.env['PREPARE_TABLES'] == 'true' && (process.env['DB_TO_USE']== "MYSQL" || process.env['DB_TO_USE']== "MYSQL_AND_MONGODB")) {
    prep();
}

module.exports = {
    tableName: tableName,
    fieldMap: fieldMap
};
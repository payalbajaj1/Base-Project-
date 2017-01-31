const config = global.baseConfig;
const mySqlConnection = config.mySqlConnection;
const tableName = 'paymentCard';
const charset = "utf8";
const engine = "InnoDB";
const collate = "utf8_unicode_ci";
const fieldMap = {
    id: "id",
    intId: "intId",
    entityId: "entityId",
    entityName: "entityName",
    stripeCustomerId: "stripeCustomerId",
    createdOn: "createdOn",
    updatedOn: "updatedOn"

};

const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (
    ${fieldMap.id} binary(16) NOT NULL PRIMARY KEY,
    ${fieldMap.intId} BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ${fieldMap.entityId} binary(16) NOT NULL,
    ${fieldMap.entityName} VARCHAR(20) NOT NULL,
    ${fieldMap.stripeCustomerId} VARCHAR(200) NOT NULL,
    ${fieldMap.createdOn} BIGINT UNSIGNED DEFAULT NULL,
    ${fieldMap.updatedOn} BIGINT UNSIGNED DEFAULT NULL,
    UNIQUE KEY maskId (${fieldMap.intId})
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
// console.log(createTable);
// console.log(dropInsertionTrigger);
// console.log('DELIMITER $$');
// console.log(insertionTrigger);
// console.log('\n$$\nDELIMITER ;\n');
// console.log(dropUpdationTrigger);
// console.log('DELIMITER $$');
// console.log(updationTrigger);
// console.log('\n$$\nDELIMITER ;\n');
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
module.exports = {
    tableName: tableName,
    fieldMap: fieldMap
};
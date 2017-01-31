require("schema/mysql/languages");
const config = global.baseConfig;
const myLogger = config.myLogger;
const dbConfig = config.db;
const mysqlConfig = dbConfig.mysqlConfig;
const mySqlConnection = config.mySqlConnection;
const dropOrderedUUId = 'DROP FUNCTION IF EXISTS \`ordered_uuid\`;';
const createAdmin = function (mycbc) {
    "use strict";
    const adminModel = require("model/admin");
    const Boom = require("boom");
    let fetchPromise = adminModel.getAdmins({
        userName: 'wmnAdmin@ClickLabs'
    }, false, true);
    fetchPromise.then(function (r) {
        if (r == false) {
            let creationPromise = adminModel.save({
                userName: 'wmnAdmin@ClickLabs',
                password: '4m4jtOpzovQ='
            });
            creationPromise.then(function (r) {
                return mycbc();
            })
                .fail(function (err) {
                    return mycbc(Boom.create(400, err));
                });
        } else {
            return mycbc('success in admin creation');
        }

    })
        .fail(function (err) {
            return mycbc(Boom.create(400, err));
        });
};
if (process.env['PREPARE_TABLES'] == 'true' && (process.env['DB_TO_USE'] == "MYSQL" || process.env['DB_TO_USE'] == "MYSQL_AND_MONGODB")) {
    const asyncM = require('async');
    const optimalUuidGenerator = `
    CREATE DEFINER=\`${mysqlConfig.user}\`@\`${mysqlConfig.host}\` FUNCTION \`ordered_uuid\`(uuid BINARY(36))
    RETURNS binary(16) DETERMINISTIC
    RETURN UNHEX(CONCAT(SUBSTR(uuid, 15, 4),SUBSTR(uuid, 10, 4),SUBSTR(uuid, 1, 8),SUBSTR(uuid, 20, 4),SUBSTR(uuid, 25)));
    `;
    asyncM.series([
        function (mycbc) {
            if (process.env.MUST_DEBUG == 'true') {
                myLogger.debug(optimalUuidGenerator);
            }
            mySqlConnection.beginTransaction(function (err) {
                if (err) {
                    myLogger.error(err);
                    throw err;
                }
                mySqlConnection.query(dropOrderedUUId, function (err, result) {
                    if (err) {
                        myLogger.error(err);
                        return mySqlConnection.rollback(function () {
                            throw err;
                        });
                    }
                    mySqlConnection.query(optimalUuidGenerator, function (err, result) {
                        if (err) {
                            myLogger.error(err);
                            return mySqlConnection.rollback(function () {
                                throw err;
                            });
                        }
                        mySqlConnection.commit(function (err) {
                            if (err) {
                                myLogger.error(err);
                                return mySqlConnection.rollback(function () {
                                    throw err;
                                });
                            }
                            if (process.env.MUST_DEBUG == 'true') {
                                myLogger.debug(optimalUuidGenerator);
                                myLogger.info('\nSuccess in uuid generator table:\n');
                            }
                            return mycbc();
                        });
                    });
                });
            });
        },
        function (mycbc) {
            require("schema/mysql/admin");
            return mycbc();
        },
        function (mycbc) {
            require("schema/mysql/authLog");
            return mycbc();
        },
        function (mycbc) {
            require("schema/mysql/membershipType");
            return mycbc();
        },
        function (mycbc) {
            require("schema/mysql/notification");
            return mycbc();
        },
        function (mycbc) {
            require("schema/mysql/messages");
            return mycbc();
        },
        function (mycbc) {
            require("schema/mysql/languages");
            return mycbc();
        },
        function (mycbc) {
            require("schema/mysql/sessionMan");
            require("schema/mysql/paymentCard");
            require("schema/mysql/relMessageLanguage");
            return mycbc();
        },
        function (mycbc) {
            return mycbc();
        }

    ], function () {
        createAdmin(function (e, d) {
            "use strict";
            console.log('in admin creation e, d', e, d);
        });
    });
}



'use strict';
const mongoose = require("mongoose");
if (process.env['DEBUG_MONGO_QUERIES'] == 'true' && (process.env['DB_TO_USE'] == "MONGODB" || process.env['DB_TO_USE'] == "MYSQL_AND_MONGODB")) {
    mongoose.set('debug', true);
}
const accountType = ['CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN'];
const actions = ['LOGIN_SUCCESS', 'LOGIN_FAIL', 'PASSWORD_CHANGE', 'LOGOUT'];
let authLogSchema = new mongoose.Schema({
    entityId: {type: String, required: true},
    entityName: {type: String, required: true, enum: accountType},
    action: {type: String, required: true, enum: actions},
}, {collection: 'AuthLogs', timestamps: {createdAt: 'createdOn', updatedAt: 'updatedOn'}});
let loggerModel = mongoose.model("AuthLog", authLogSchema);
authLogSchema.index({
    "entityId": 1,
}, {
    background: true
});
module.exports = {
    loggerModel: loggerModel
};
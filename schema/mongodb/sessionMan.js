'use strict';
const mongoose = require("mongoose");
if (process.env['DEBUG_MONGO_QUERIES'] == 'true' && (process.env['DB_TO_USE'] == "MONGODB" || process.env['DB_TO_USE'] == "MYSQL_AND_MONGODB")) {
    mongoose.set('debug', true);
}

const config = global.baseConfig;
let session = {
    entityId: {type: String, required: true},
    sessionKey: {type: String, required: true},
    valid: {type: Boolean, default: false},
    expiresOn: {type: Number, required: true},
    scope: {type: String, required: true, enum: Object.keys(config.auth.validScopes)},
};
let sessionSchema = new mongoose.Schema(session, {
    collection: "Sessions",
    timestamps: {createdAt: 'createdOn', updatedAt: 'updatedOn'}
});
let sessionModel = mongoose.model("Session", sessionSchema);
sessionSchema.index({
    "entityId": 1,
}, {
    background: true
});
module.exports = {
    session: sessionModel
};
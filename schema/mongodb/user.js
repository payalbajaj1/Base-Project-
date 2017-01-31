'use strict';
const utilities = require("Utils/CommonFunctions");
const mongoose = require("mongoose");
if (process.env['DEBUG_MONGO_QUERIES'] == 'true' && (process.env['DB_TO_USE'] == "MONGODB" || process.env['DB_TO_USE'] == "MYSQL_AND_MONGODB")) {
    mongoose.set('debug', true);
}
const accountType = ['CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN'];
let userSchema = new mongoose.Schema({
    name: {type: String, required: true, maxlength: 100, minlength: 5},
    userType: {type: String, required: true, enum: accountType},
    uemail: {type: String, required: true},
    phoneNumber: {type: Number, required: true},
    countryCallingCode: {type: String, required: true, enum: utilities.countryCodes},
    isApproved: {type: Boolean, default: false},//By admin
    isBlocked: {type: Boolean, default: false},//By admin
    isDeleted: {type: Boolean, default: false},//By admin or by user
    age: {type: Number, min: 18, max: 50, required: true},
    dateOfBirth: {type: Date, min: Date('1980-01-01')},
    location: {
        'type': {type: String, enum: ["Point"], default: "Point"},
        coordinates: {type: [Number], default: [0, 0]}
    },
}, {collection: 'Users', timestamps: {createdAt: 'createdOn', updatedAt: 'updatedOn'}});
userSchema.index({'location': '2dsphere'});
userSchema.index({
    "userType": 1,
    "email": 1
}, {
    unique: true,
    background: true,
    "name": "user_phn_unique"
});
userSchema.index({
    "userType": 1,
    "phoneNumber": 1
}, {
    unique: true,
    background: true,
    "name": "usr_email_unique"
});
let userModel = mongoose.model("User", userSchema);
module.exports = {
    user: userModel
};
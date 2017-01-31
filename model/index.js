'use strict';
const all = [].concat(
    require('model/admin'),
    require('model/authLog'),
    require('model/membership'),
    require('model/notification'),
    require('model/paymentCard'),
    require('model/sessionMan')
);
module.exports = all;
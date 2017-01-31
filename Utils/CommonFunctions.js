/**
 * Authenticated encryption using GCM
 * IV length for aes-256-gcm must be 12 bytes
 * authKey length must be 32 characters
 */
"use strict";
const secRand = require("secure-random");
const initVector = secRand(12, {type: 'Buffer'});
const crypto = require('crypto');
const Bcrypt = require('bcrypt');
const algorithm = 'aes-256-gcm';
const s3config = global.baseConfig.amazon.s3;
let AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: s3config.accessKeyId,
    secretAccessKey: s3config.secretAccessKey
});
const awsDirectUploadViabuffer = function (bufferObjects, cb) {
    "use strict";
    const s3bucket = new AWS.S3();
    const fileType = require('file-type');
    let counter = 0;
    const totalFiles = Object.keys(bufferObjects).length;
    for (var bucketKey in bufferObjects) {
        if (bufferObjects.hasOwnProperty(bucketKey)) {
            const dataBuffer = bufferObjects[bucketKey];
            const stats = fileType(dataBuffer);
            const params = {
                Bucket: s3config.bucket,
                Key: bucketKey,
                Body: dataBuffer,
                ACL: 'public-read',
                ContentType: stats.mime
            };
            s3bucket.putObject(params, function (err, data) {
                counter = counter + 1;
                if (err) {
                    return cb(err);
                }
                if (totalFiles == counter) {
                    return cb(null);
                }
            });
        }
    }
};

const failActionFunction = function (request, reply, source, error) {
    var customErrorMessage = '';
    if (error.output.payload.message.indexOf("[") > -1) {
        customErrorMessage = error.output.payload.message.substr(error.output.payload.message.indexOf("["));
    } else {
        customErrorMessage = error.output.payload.message;
    }
    customErrorMessage = customErrorMessage.replace(/"/g, '');
    customErrorMessage = customErrorMessage.replace('[', '');
    customErrorMessage = customErrorMessage.replace(']', '');
    error.output.payload.message = customErrorMessage;
    delete error.output.payload.validation;
    return reply(error);
};
/**
 * must be of length = 32
 * Dont change its value unless you want to loose access to all encrypted stuff
 */


const authKey = 'eca82e6d5fbb7e5abaaa2709d2739b7a';

function generatePlainPassword(length) {
    return secRand(length, {type: 'Buffer'}).toString('hex');
}

function encryptText(plainText) {
    var cipher = crypto.createCipheriv(algorithm, authKey, initVector);
    var encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    var tag = cipher.getAuthTag();
    return {
        content: encrypted,
        tag: tag,
        initVector: initVector
    };
}

function decryptText(encrypted, storedIv) {
    var decipher = crypto.createDecipheriv(algorithm, authKey, storedIv);
    decipher.setAuthTag(encrypted.tag);
    var dec = decipher.update(encrypted.content, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}
const getNextAlphaString = function (str) {
    "use strict";
    str = str.toUpperCase();
    let chars;
    chars = str.split("");
    const strLen = str.length;
    let continueIncermenting = true;
    for (let i = strLen - 1; i >= 0; i = i - 1) {
        let asciiVal;
        asciiVal = chars[i].charCodeAt(0);
        if (isNaN(asciiVal)) {
            return str;
        }


        if (continueIncermenting === true) {
            if (asciiVal >= 48 && asciiVal < 57) {
                chars[i] = String.fromCharCode(asciiVal + 1);
                continueIncermenting = false;
                break;
            } else if (asciiVal == 57) {
                chars[i] = '0';
                continueIncermenting = true;
            }
            if (asciiVal >= 65 && asciiVal < 90) {
                chars[i] = String.fromCharCode(asciiVal + 1);
                continueIncermenting = false;
                break;
            } else if (asciiVal == 90) {
                chars[i] = String.fromCharCode(65);

                continueIncermenting = true;
            }
        } else {
            if (asciiVal == 90) {
                continueIncermenting = true;
                chars[i] = String.fromCharCode(65);
            }
            if (asciiVal == 57) {
                continueIncermenting = true;
                chars[i] = '0';
            }
        }
    }
    if (continueIncermenting === true) {
        let firstAcii = chars[0].charCodeAt(0);
        if (isNaN(firstAcii)) {
            return str;
        }
        if ((firstAcii >= 65 && firstAcii <= 90) || (firstAcii >= 97 && firstAcii <= 122)) {
            return 'A' + chars.join('').toUpperCase();
        }
        if (firstAcii >= 48 && firstAcii <= 57) {
            return '0' + chars.join('').toUpperCase();
        }
    }
    return chars.join('').toUpperCase();

};
const maxRadiusImKm = Number(5);
const maxRadiusInMiles = Number(maxRadiusImKm * 0.621371);
const maxRadiusInMetres = Number(maxRadiusInMiles / 0.00062137);
const nearbylocatorTrigno = function (coord1, coord2) {
    Number.prototype.toRad = function () {
        return this * Math.PI / 180;
    };
    var lat2 = Number(coord1.latitude);
    var lon2 = Number(coord1.longitude);
    var lat1 = Number(coord2.latitude);
    var lon1 = Number(coord2.longitude);
    if (!Math.floor(lat1) || !Math.floor(lat2) || !Math.floor(lon1) || !Math.floor(lon2)) {
        return 9007199254740991;
    }
    var a = 6378137,
        b = 6356752.314245,
        f = 1 / 298.257223563;
    var L = (lon2 - lon1).toRad();
    var U1 = Math.atan((1 - f) * Math.tan(lat1.toRad()));
    var U2 = Math.atan((1 - f) * Math.tan(lat2.toRad()));
    var sinU1 = Math.sin(U1),
        cosU1 = Math.cos(U1);
    var sinU2 = Math.sin(U2),
        cosU2 = Math.cos(U2);

    var lambda = L,
        lambdaP, iterLimit = 100;
    do {
        var sinLambda = Math.sin(lambda),
            cosLambda = Math.cos(lambda);
        var sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) +
            (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) *
            (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
        if (sinSigma == 0)
            return 0;
        var cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
        var sigma = Math.atan2(sinSigma, cosSigma);
        var sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
        var cosSqAlpha = 1 - sinAlpha * sinAlpha;
        var cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
        if (isNaN(cos2SigmaM))
            cos2SigmaM = 0;
        var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
        lambdaP = lambda;
        lambda = L +
            (1 - C) *
            f *
            sinAlpha *
            (sigma + C * sinSigma *
            (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

    if (iterLimit == 0)
        return NaN;
    var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    var deltaSigma = B *
        sinSigma *
        (cos2SigmaM + B /
        4 *
        (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM *
        (-3 + 4 * sinSigma * sinSigma) *
        (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    var s = b * A * (sigma - deltaSigma);

    s = s.toFixed(3);
    return s;
};

const saltLength = 10;
const hashPassword = function (plaintextPassword) {
    return Bcrypt.hashSync(plaintextPassword, Bcrypt.genSaltSync(saltLength));
};
var hashPasswordUsingBcrypt = function (plainTextPassword) {
    const saltRounds = 10;
    return Bcrypt.hashSync(plainTextPassword, saltRounds);
};
var comparePasswordUsingBcrypt = function (plainTextPassword, passwordhash) {
    return Bcrypt.compareSync(plainTextPassword, passwordhash);
};
const allCountries = [
    ["Afghanistan (‫افغانستان‬‎)", "af", "93"],
    ["Albania (Shqipëri)", "al", "355"],
    ["Algeria (‫الجزائر‬‎)", "dz", "213"],
    ["American Samoa", "as", "1684"],
    ["Andorra", "ad", "376"],
    ["Angola", "ao", "244"],
    ["Anguilla", "ai", "1264"],
    ["Antigua and Barbuda", "ag", "1268"],
    ["Argentina", "ar", "54"],
    ["Armenia (Հայաստան)", "am", "374"],
    ["Aruba", "aw", "297"],
    ["Australia", "au", "61", 0],
    ["Austria (Österreich)", "at", "43"],
    ["Azerbaijan (Azərbaycan)", "az", "994"],
    ["Bahamas", "bs", "1242"],
    ["Bahrain (‫البحرين‬‎)", "bh", "973"],
    ["Bangladesh (বাংলাদেশ)", "bd", "880"],
    ["Barbados", "bb", "1246"],
    ["Belarus (Беларусь)", "by", "375"],
    ["Belgium (België)", "be", "32"],
    ["Belize", "bz", "501"],
    ["Benin (Bénin)", "bj", "229"],
    ["Bermuda", "bm", "1441"],
    ["Bhutan (འབྲུག)", "bt", "975"],
    ["Bolivia", "bo", "591"],
    ["Bosnia and Herzegovina (Босна и Херцеговина)", "ba", "387"],
    ["Botswana", "bw", "267"],
    ["Brazil (Brasil)", "br", "55"],
    ["British Indian Ocean Territory", "io", "246"],
    ["British Virgin Islands", "vg", "1284"],
    ["Brunei", "bn", "673"],
    ["Bulgaria (България)", "bg", "359"],
    ["Burkina Faso", "bf", "226"],
    ["Burundi (Uburundi)", "bi", "257"],
    ["Cambodia (កម្ពុជា)", "kh", "855"],
    ["Cameroon (Cameroun)", "cm", "237"],
    ["Canada", "ca", "1", 1, ["204", "226", "236", "249", "250", "289", "306", "343", "365", "387", "403", "416", "418", "431", "437", "438", "450", "506", "514", "519", "548", "579", "581", "587", "604", "613", "639", "647", "672", "705", "709", "742", "778", "780", "782", "807", "819", "825", "867", "873", "902", "905"]],
    ["Cape Verde (Kabu Verdi)", "cv", "238"],
    ["Caribbean Netherlands", "bq", "599", 1],
    ["Cayman Islands", "ky", "1345"],
    ["Central African Republic (République centrafricaine)", "cf", "236"],
    ["Chad (Tchad)", "td", "235"],
    ["Chile", "cl", "56"],
    ["China (中国)", "cn", "86"],
    ["Christmas Island", "cx", "61", 2],
    ["Cocos (Keeling) Islands", "cc", "61", 1],
    ["Colombia", "co", "57"],
    ["Comoros (‫جزر القمر‬‎)", "km", "269"],
    ["Congo (DRC) (Jamhuri ya Kidemokrasia ya Kongo)", "cd", "243"],
    ["Congo (Republic) (Congo-Brazzaville)", "cg", "242"],
    ["Cook Islands", "ck", "682"],
    ["Costa Rica", "cr", "506"],
    ["Côte d’Ivoire", "ci", "225"],
    ["Croatia (Hrvatska)", "hr", "385"],
    ["Cuba", "cu", "53"],
    ["Curaçao", "cw", "599", 0],
    ["Cyprus (Κύπρος)", "cy", "357"],
    ["Czech Republic (Česká republika)", "cz", "420"],
    ["Denmark (Danmark)", "dk", "45"],
    ["Djibouti", "dj", "253"],
    ["Dominica", "dm", "1767"],
    ["Dominican Republic (República Dominicana)", "do", "1", 2, ["809", "829", "849"]],
    ["Ecuador", "ec", "593"],
    ["Egypt (‫مصر‬‎)", "eg", "20"],
    ["El Salvador", "sv", "503"],
    ["Equatorial Guinea (Guinea Ecuatorial)", "gq", "240"],
    ["Eritrea", "er", "291"],
    ["Estonia (Eesti)", "ee", "372"],
    ["Ethiopia", "et", "251"],
    ["Falkland Islands (Islas Malvinas)", "fk", "500"],
    ["Faroe Islands (Føroyar)", "fo", "298"],
    ["Fiji", "fj", "679"],
    ["Finland (Suomi)", "fi", "358", 0],
    ["France", "fr", "33"],
    ["French Guiana (Guyane française)", "gf", "594"],
    ["French Polynesia (Polynésie française)", "pf", "689"],
    ["Gabon", "ga", "241"],
    ["Gambia", "gm", "220"],
    ["Georgia (საქართველო)", "ge", "995"],
    ["Germany (Deutschland)", "de", "49"],
    ["Ghana (Gaana)", "gh", "233"],
    ["Gibraltar", "gi", "350"],
    ["Greece (Ελλάδα)", "gr", "30"],
    ["Greenland (Kalaallit Nunaat)", "gl", "299"],
    ["Grenada", "gd", "1473"],
    ["Guadeloupe", "gp", "590", 0],
    ["Guam", "gu", "1671"],
    ["Guatemala", "gt", "502"],
    ["Guernsey", "gg", "44", 1],
    ["Guinea (Guinée)", "gn", "224"],
    ["Guinea-Bissau (Guiné Bissau)", "gw", "245"],
    ["Guyana", "gy", "592"],
    ["Haiti", "ht", "509"],
    ["Honduras", "hn", "504"],
    ["Hong Kong (香港)", "hk", "852"],
    ["Hungary (Magyarország)", "hu", "36"],
    ["Iceland (Ísland)", "is", "354"],
    ["India (भारत)", "in", "91"],
    ["Indonesia", "id", "62"],
    ["Iran (‫ایران‬‎)", "ir", "98"],
    ["Iraq (‫العراق‬‎)", "iq", "964"],
    ["Ireland", "ie", "353"],
    ["Isle of Man", "im", "44", 2],
    ["Israel (‫ישראל‬‎)", "il", "972"],
    ["Italy (Italia)", "it", "39", 0],
    ["Jamaica", "jm", "1876"],
    ["Japan (日本)", "jp", "81"],
    ["Jersey", "je", "44", 3],
    ["Jordan (‫الأردن‬‎)", "jo", "962"],
    ["Kazakhstan (Казахстан)", "kz", "7", 1],
    ["Kenya", "ke", "254"],
    ["Kiribati", "ki", "686"],
    ["Kuwait (‫الكويت‬‎)", "kw", "965"],
    ["Kyrgyzstan (Кыргызстан)", "kg", "996"],
    ["Laos (ລາວ)", "la", "856"],
    ["Latvia (Latvija)", "lv", "371"],
    ["Lebanon (‫لبنان‬‎)", "lb", "961"],
    ["Lesotho", "ls", "266"],
    ["Liberia", "lr", "231"],
    ["Libya (‫ليبيا‬‎)", "ly", "218"],
    ["Liechtenstein", "li", "423"],
    ["Lithuania (Lietuva)", "lt", "370"],
    ["Luxembourg", "lu", "352"],
    ["Macau (澳門)", "mo", "853"],
    ["Macedonia (FYROM) (Македонија)", "mk", "389"],
    ["Madagascar (Madagasikara)", "mg", "261"],
    ["Malawi", "mw", "265"],
    ["Malaysia", "my", "60"],
    ["Maldives", "mv", "960"],
    ["Mali", "ml", "223"],
    ["Malta", "mt", "356"],
    ["Marshall Islands", "mh", "692"],
    ["Martinique", "mq", "596"],
    ["Mauritania (‫موريتانيا‬‎)", "mr", "222"],
    ["Mauritius (Moris)", "mu", "230"],
    ["Mayotte", "yt", "262", 1],
    ["Mexico (México)", "mx", "52"],
    ["Micronesia", "fm", "691"],
    ["Moldova (Republica Moldova)", "md", "373"],
    ["Monaco", "mc", "377"],
    ["Mongolia (Монгол)", "mn", "976"],
    ["Montenegro (Crna Gora)", "me", "382"],
    ["Montserrat", "ms", "1664"],
    ["Morocco (‫المغرب‬‎)", "ma", "212", 0],
    ["Mozambique (Moçambique)", "mz", "258"],
    ["Myanmar (Burma) (မြန်မာ)", "mm", "95"],
    ["Namibia (Namibië)", "na", "264"],
    ["Nauru", "nr", "674"],
    ["Nepal (नेपाल)", "np", "977"],
    ["Netherlands (Nederland)", "nl", "31"],
    ["New Caledonia (Nouvelle-Calédonie)", "nc", "687"],
    ["New Zealand", "nz", "64"],
    ["Nicaragua", "ni", "505"],
    ["Niger (Nijar)", "ne", "227"],
    ["Nigeria", "ng", "234"],
    ["Niue", "nu", "683"],
    ["Norfolk Island", "nf", "672"],
    ["North Korea (조선 민주주의 인민 공화국)", "kp", "850"],
    ["Northern Mariana Islands", "mp", "1670"],
    ["Norway (Norge)", "no", "47", 0],
    ["Oman (‫عُمان‬‎)", "om", "968"],
    ["Pakistan (‫پاکستان‬‎)", "pk", "92"],
    ["Palau", "pw", "680"],
    ["Palestine (‫فلسطين‬‎)", "ps", "970"],
    ["Panama (Panamá)", "pa", "507"],
    ["Papua New Guinea", "pg", "675"],
    ["Paraguay", "py", "595"],
    ["Peru (Perú)", "pe", "51"],
    ["Philippines", "ph", "63"],
    ["Poland (Polska)", "pl", "48"],
    ["Portugal", "pt", "351"],
    ["Puerto Rico", "pr", "1", 3, ["787", "939"]],
    ["Qatar (‫قطر‬‎)", "qa", "974"],
    ["Réunion (La Réunion)", "re", "262", 0],
    ["Romania (România)", "ro", "40"],
    ["Russia (Россия)", "ru", "7", 0],
    ["Rwanda", "rw", "250"],
    ["Saint Barthélemy (Saint-Barthélemy)", "bl", "590", 1],
    ["Saint Helena", "sh", "290"],
    ["Saint Kitts and Nevis", "kn", "1869"],
    ["Saint Lucia", "lc", "1758"],
    ["Saint Martin (Saint-Martin (partie française))", "mf", "590", 2],
    ["Saint Pierre and Miquelon (Saint-Pierre-et-Miquelon)", "pm", "508"],
    ["Saint Vincent and the Grenadines", "vc", "1784"],
    ["Samoa", "ws", "685"],
    ["San Marino", "sm", "378"],
    ["São Tomé and Príncipe (São Tomé e Príncipe)", "st", "239"],
    ["Saudi Arabia (‫المملكة العربية السعودية‬‎)", "sa", "966"],
    ["Senegal (Sénégal)", "sn", "221"],
    ["Serbia (Србија)", "rs", "381"],
    ["Seychelles", "sc", "248"],
    ["Sierra Leone", "sl", "232"],
    ["Singapore", "sg", "65"],
    ["Sint Maarten", "sx", "1721"],
    ["Slovakia (Slovensko)", "sk", "421"],
    ["Slovenia (Slovenija)", "si", "386"],
    ["Solomon Islands", "sb", "677"],
    ["Somalia (Soomaaliya)", "so", "252"],
    ["South Africa", "za", "27"],
    ["South Korea (대한민국)", "kr", "82"],
    ["South Sudan (‫جنوب السودان‬‎)", "ss", "211"],
    ["Spain (España)", "es", "34"],
    ["Sri Lanka (ශ්‍රී ලංකාව)", "lk", "94"],
    ["Sudan (‫السودان‬‎)", "sd", "249"],
    ["Suriname", "sr", "597"],
    ["Svalbard and Jan Mayen", "sj", "47", 1],
    ["Swaziland", "sz", "268"],
    ["Sweden (Sverige)", "se", "46"],
    ["Switzerland (Schweiz)", "ch", "41"],
    ["Syria (‫سوريا‬‎)", "sy", "963"],
    ["Taiwan (台灣)", "tw", "886"],
    ["Tajikistan", "tj", "992"],
    ["Tanzania", "tz", "255"],
    ["Thailand (ไทย)", "th", "66"],
    ["Timor-Leste", "tl", "670"],
    ["Togo", "tg", "228"],
    ["Tokelau", "tk", "690"],
    ["Tonga", "to", "676"],
    ["Trinidad and Tobago", "tt", "1868"],
    ["Tunisia (‫تونس‬‎)", "tn", "216"],
    ["Turkey (Türkiye)", "tr", "90"],
    ["Turkmenistan", "tm", "993"],
    ["Turks and Caicos Islands", "tc", "1649"],
    ["Tuvalu", "tv", "688"],
    ["U.S. Virgin Islands", "vi", "1340"],
    ["Uganda", "ug", "256"],
    ["Ukraine (Україна)", "ua", "380"],
    ["United Arab Emirates (‫الإمارات العربية المتحدة‬‎)", "ae", "971"],
    ["United Kingdom", "gb", "44", 0],
    ["United States", "us", "1", 0],
    ["Uruguay", "uy", "598"],
    ["Uzbekistan (Oʻzbekiston)", "uz", "998"],
    ["Vanuatu", "vu", "678"],
    ["Vatican City (Città del Vaticano)", "va", "39", 1],
    ["Venezuela", "ve", "58"],
    ["Vietnam (Việt Nam)", "vn", "84"],
    ["Wallis and Futuna", "wf", "681"],
    ["Western Sahara (‫الصحراء الغربية‬‎)", "eh", "212", 1],
    ["Yemen (‫اليمن‬‎)", "ye", "967"],
    ["Zambia", "zm", "260"],
    ["Zimbabwe", "zw", "263"],
    ["Åland Islands", "ax", "358", 1]
];

const countryCodes = [];
/**
 * https://mathiasbynens.be/notes/es6-const
 */
for (var i = 0; i < allCountries.length; i = i + 1) {
    countryCodes.push(allCountries[i][2]);
}
const swaggerDefaultResponseMessages = [
    {code: 200, message: 'OK'},
    {code: 400, message: 'Bad Request'},
    {code: 401, message: 'Unauthorized'},
    {code: 404, message: 'Data Not Found'},
    {code: 500, message: 'Internal Server Error'}
];
const validatePhoneNumber = function (inputtxt) {
    var phoneno = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (inputtxt.value.match(phoneno)) {
        return true;
    } else {
        return false;
    }
};

/**
 * speed up your geofencing logic
 *
 * No need for mongodb's geoSpatial features
 */
let isPointInsidePolygon = function (lat, long, array) {
    /**
     * https://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
     */
    let contains = function (bounds, lat, lng) {
        let count = 0;
        for (let b = 0; b < bounds.length; b++) {
            let vertex1 = bounds[b];
            let vertex2 = bounds[(b + 1) % bounds.length];
            if (west(vertex1, vertex2, lng, lat))
                ++count;
        }
        return count % 2;
        /**
         * @return {boolean} true if (x,y) is west of the line segment connecting A and B
         */
        function west(A, B, x, y) {
            if (A.y <= B.y) {
                if (y <= A.y || y > B.y ||
                    x >= A.x && x >= B.x) {
                    return false;
                } else if (x < A.x && x < B.x) {
                    return true;
                } else {
                    return (y - A.y) / (x - A.x) > (B.y - A.y) / (B.x - A.x);
                }
            } else {
                return west(B, A, x, y);
            }
        }
    };
    let returnObject = {};
    let polygon = [];
    for (let i = 0; i < array.length; i++) {
        let p = array[i];
        if (contains(p, lat, long)) {
            polygon.push(p);
        }
    }
    if (polygon.length > 0) {
        returnObject.code = true;
        returnObject.polygons = polygon;
        return returnObject;
    } else {
        returnObject.code = false;
        return returnObject;
    }
};
/**
 * Get current client(Browser) time w.r.t zone.
 * @param timezone
 * @timeZoneFormat: moment.tz.names()
 * @returns {moment}
 */
const getClientTimeAccToZone = function (timezone) {
//console.log('TimeZone:--->>>>',moment.tz.names());
    var zone = momentZone.tz(moment().toDate().getTime(), timezone).format('YYYY-MM-DDTHH:mm:ss');
    return moment(zone);
};
module.exports = {
    getClientTimeAccToZone: getClientTimeAccToZone,
    isPointInsidePolygon: isPointInsidePolygon,
    awsDirectUploadViabuffer: awsDirectUploadViabuffer,
    hashPasswordUsingBcrypt: hashPasswordUsingBcrypt,
    comparePasswordUsingBcrypt: comparePasswordUsingBcrypt,
    validatePhoneNumber: validatePhoneNumber,
    getNextAlphaString: getNextAlphaString,
    countryCodes: countryCodes,
    hashPassword: hashPassword,
    maxRadiusInMetres: maxRadiusInMetres,
    nearbylocatorTrigno: nearbylocatorTrigno,
    generatePlainPassword: generatePlainPassword,
    encryptText: encryptText,
    decryptText: decryptText,
    failActionFunction: failActionFunction,
    swaggerDefaultResponseMessages: swaggerDefaultResponseMessages
};


const crypto = require("crypto");

function hashPassword(password, salt) {
    const hash = crypto.createHash("md5");

    hash.update(password + salt);

    return hash.digest("hex");
}

module.exports = {
    hashPassword
}
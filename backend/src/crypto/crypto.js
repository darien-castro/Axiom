const { createHash } = require('crypto');
require('dotenv').config();

const secretkey = process.env.HASH_KEY

function sha256(content) {  
    return createHash('sha256', secretkey).update(String(content)).digest();
}

module.exports = { sha256 }

const { createHash } = require('crypto');

function sha256(content) {  
    return createHash('sha256').update(String(content)).digest();
}

module.exports = { sha256 }

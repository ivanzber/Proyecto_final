const bcrypt = require('bcrypt');
const fs = require('fs');

const password = 'Admin123!';

bcrypt.hash(password, 10).then(hash => {
    console.log('Generated hash:', hash);
    fs.writeFileSync('hash.txt', hash);
});

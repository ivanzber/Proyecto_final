const bcrypt = require('bcrypt');

const password = 'Admin123!';
const hash = '$2b$10$rQVZ3p5h9Sq7jYBKQxD6KuZN.ELqYxGj0mKXQb4YN1TfH8mVGqBkW';

bcrypt.compare(password, hash).then(result => {
    console.log('Password match:', result);
    if (!result) {
        console.log('Generating new hash...');
        bcrypt.hash(password, 10).then(newHash => {
            console.log('New hash:', newHash);
        });
    }
});

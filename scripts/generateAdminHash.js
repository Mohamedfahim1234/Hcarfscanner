const bcrypt = require('bcrypt');
const prompt = require('prompt-sync')();

const password = prompt('Enter new admin password: ');
const hash = bcrypt.hashSync(password, 12);
console.log('Hashed password:\n', hash);

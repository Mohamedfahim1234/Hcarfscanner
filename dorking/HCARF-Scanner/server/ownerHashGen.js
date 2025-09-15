// server/ownerHashGen.js
const bcrypt = require('bcryptjs');
const [,, password] = process.argv;
if (!password) {
  console.log('Usage: node ownerHashGen.js <password>');
  process.exit(1);
}
bcrypt.hash(password, 12).then(hash => {
  console.log('Paste this in your .env:');
  console.log('OWNER_HASHED_PASSWORD=' + hash);
});

/**
 * Script de utilidad para verificar que un hash bcrypt corresponde a una contraseña.
 * USO: Pasar la contraseña y el hash como variables de entorno, NO hardcodeados.
 *
 * Ejecutar:
 *   ADMIN_PASSWORD=TuContraseña ADMIN_HASH=<hash> node verify-hash.js
 * O en Windows:
 *   set ADMIN_PASSWORD=TuContraseña && set ADMIN_HASH=<hash> && node verify-hash.js
 */
const bcrypt = require('bcrypt');

const password = process.env.ADMIN_PASSWORD;
const hash = process.env.ADMIN_HASH;

if (!password || !hash) {
  console.error('ERROR: Debes proporcionar ADMIN_PASSWORD y ADMIN_HASH como variables de entorno.');
  console.error('Ejemplo: ADMIN_PASSWORD=TuContraseña ADMIN_HASH=<bcrypt_hash> node verify-hash.js');
  process.exit(1);
}

bcrypt.compare(password, hash).then(result => {
  console.log('Password match:', result);
  if (!result) {
    console.log('Generating new hash...');
    bcrypt.hash(password, 10).then(newHash => {
      console.log('New hash:', newHash);
    });
  }
});

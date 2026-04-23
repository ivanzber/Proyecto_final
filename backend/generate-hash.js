/**
 * Script de utilidad para generar un hash bcrypt de una contraseña.
 * USO: Pasar la contraseña como variable de entorno, NO hardcodeada en el código.
 *
 * Ejecutar:
 *   ADMIN_PASSWORD=TuContraseña node generate-hash.js
 * O en Windows:
 *   set ADMIN_PASSWORD=TuContraseña && node generate-hash.js
 */
const bcrypt = require('bcrypt');
const fs = require('fs');

const password = process.env.ADMIN_PASSWORD;

if (!password) {
  console.error('ERROR: Debes proporcionar la contraseña como variable de entorno ADMIN_PASSWORD.');
  console.error('Ejemplo: ADMIN_PASSWORD=TuContraseña node generate-hash.js');
  process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
  console.log('Generated hash:', hash);
  fs.writeFileSync('hash.txt', hash);
  console.log('Hash guardado en hash.txt');
});

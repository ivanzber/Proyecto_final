const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
    // 1. Leer config del .env
    const envPath = path.resolve(__dirname, '../.env');
    console.log('Leyendo .env de:', envPath);
    
    let config = {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'campus_virtual'
    };

    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...rest] = line.split('=');
            if (key) {
                const val = rest.join('=').trim();
                if (key.trim() === 'DB_HOST') config.host = val;
                if (key.trim() === 'DB_PORT') config.port = parseInt(val);
                if (key.trim() === 'DB_USER') config.user = val;
                if (key.trim() === 'DB_PASS') config.password = val;
                if (key.trim() === 'DB_NAME') config.database = val;
            }
        });
    }

    console.log('Conectando a MySQL con:', { ...config, password: '***' });

    try {
        const connection = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            multipleStatements: true
        });

        console.log('¡Conectado exitosamente!');

        // 2. Leer seeds.sql
        const seedsPath = path.resolve(__dirname, '../../database/seeds.sql');
        console.log('Leyendo seeds de:', seedsPath);
        const seedsSql = fs.readFileSync(seedsPath, 'utf8');

        // 3. Ejecutar
        console.log('Ejecutando seeds...');
        // Asegurar que usamos la DB correcta
        await connection.query(`USE ${config.database}`);
        
        // Ejecutar el script SQL
        await connection.query(seedsSql);
        
        console.log('✅ Seeds ejecutados correctamente. Credenciales de admin creadas.');
        await connection.end();

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

run();

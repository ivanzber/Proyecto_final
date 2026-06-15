const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
    const envPath = path.resolve(__dirname, '../.env');
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
                if (key.trim() === 'DB_PORT') config.port = Number.parseInt(val);
                if (key.trim() === 'DB_USER') config.user = val;
                if (key.trim() === 'DB_PASS') config.password = val;
                if (key.trim() === 'DB_NAME') config.database = val;
            }
        });
    }

    try {
        const connection = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            multipleStatements: true
        });

        await connection.query(`USE ${config.database}`);

        // Insert some fake statistics
        console.log('Insertando datos de prueba en la tabla statistics...');
        
        // Asumiendo que entityType = 'point_of_interest' y eventType = 'poi_visit' 
        const queries = `
            INSERT INTO statistics (session_id, event_type, entity_type, entity_id, metadata, created_at) VALUES 
            ('session1', 'poi_visit', 'point_of_interest', 1, '{}', NOW() - INTERVAL 1 DAY),
            ('session2', 'poi_visit', 'point_of_interest', 1, '{}', NOW() - INTERVAL 1 DAY),
            ('session3', 'poi_visit', 'point_of_interest', 2, '{}', NOW() - INTERVAL 2 DAY),
            ('session4', 'poi_visit', 'point_of_interest', 2, '{}', NOW() - INTERVAL 2 DAY),
            ('session5', 'poi_visit', 'point_of_interest', 2, '{}', NOW() - INTERVAL 3 DAY),
            ('session6', 'poi_visit', 'point_of_interest', 3, '{}', NOW() - INTERVAL 1 DAY),
            ('session7', 'poi_visit', 'point_of_interest', 4, '{}', NOW()),
            ('session8', 'poi_visit', 'point_of_interest', 4, '{}', NOW()),
            ('session9', 'poi_visit', 'point_of_interest', 4, '{}', NOW());
        `;

        await connection.query(queries);

        console.log('✅ Datos de prueba insertados exitosamente.');
        await connection.end();

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

run();

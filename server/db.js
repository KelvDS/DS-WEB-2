import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';

const dbType = process.env.DB_TYPE || 'sqlite';
console.log(`🧠 Using database engine: ${dbType.toUpperCase()}`);

let query;
let initDB;

if (dbType === 'postgres') {
  // ---------------- PostgreSQL Setup ----------------
  const { Pool } = (await import('pg')).default;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  query = (text, params = []) => pool.query(text, params);

  initDB = async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('super','admin','client')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS galleries (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        gallery_id INTEGER NOT NULL REFERENCES galleries(id),
        filename TEXT NOT NULL,
        watermarked_filename TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS gallery_requests (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS client_galleries (
        client_id INTEGER NOT NULL REFERENCES users(id),
        gallery_id INTEGER NOT NULL REFERENCES galleries(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (client_id, gallery_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS favorites (
        client_id INTEGER NOT NULL REFERENCES users(id),
        image_id INTEGER NOT NULL REFERENCES images(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (client_id, image_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS selections (
        client_id INTEGER NOT NULL REFERENCES users(id),
        image_id INTEGER NOT NULL REFERENCES images(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (client_id, image_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS highres_requests (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES users(id),
        image_ids_json TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','delivered')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS approved_downloads (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES users(id),
        image_id INTEGER NOT NULL REFERENCES images(id),
        request_id INTEGER NOT NULL REFERENCES highres_requests(id),
        approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(client_id, image_id)
      );
    `);

    const result = await query('SELECT * FROM users WHERE email = $1', ['kelvrambo@gmail.com']);
    if (result.rows.length === 0) {
      const hash = bcrypt.hashSync('Kelv2580', 10);
      await query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
        ['kelvrambo@gmail.com', hash, 'super']
      );
      console.log('✅ Super Admin created: kelvrambo@gmail.com');
    }
  };

} else {
  // ---------------- SQLite Setup ----------------
  const sqlite3 = (await import('sqlite3')).default;
  import path from 'path';
  import { fileURLToPath } from 'url';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const db = new sqlite3.Database(path.join(__dirname, 'daperfect.db'));

  query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    });
  };

  initDB = async () => {
    await query(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super','admin','client')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`CREATE TABLE IF NOT EXISTS galleries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gallery_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      watermarked_filename TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gallery_id) REFERENCES galleries(id)
    )`);

    await query(`CREATE TABLE IF NOT EXISTS gallery_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES users(id)
    )`);

    await query(`CREATE TABLE IF NOT EXISTS client_galleries (
      client_id INTEGER NOT NULL,
      gallery_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (client_id, gallery_id),
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (gallery_id) REFERENCES galleries(id)
    )`);

    await query(`CREATE TABLE IF NOT EXISTS favorites (
      client_id INTEGER NOT NULL,
      image_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (client_id, image_id),
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (image_id) REFERENCES images(id)
    )`);

    await query(`CREATE TABLE IF NOT EXISTS selections (
      client_id INTEGER NOT NULL,
      image_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (client_id, image_id),
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (image_id) REFERENCES images(id)
    )`);

    await query(`CREATE TABLE IF NOT EXISTS highres_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      image_ids_json TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','delivered')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES users(id)
    )`);

    await query(`CREATE TABLE IF NOT EXISTS approved_downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      image_id INTEGER NOT NULL,
      request_id INTEGER NOT NULL,
      approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(client_id, image_id),
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (image_id) REFERENCES images(id),
      FOREIGN KEY (request_id) REFERENCES highres_requests(id)
    )`);

    const result = await query('SELECT * FROM users WHERE email = ?', ['kelvrambo@gmail.com']);
    if (result.rows.length === 0) {
      const hash = bcrypt.hashSync('Kelv2580', 10);
      await query(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        ['kelvrambo@gmail.com', hash, 'super']
      );
      console.log('✅ Super Admin created: kelvrambo@gmail.com');
    }
  };
}

export { query, initDB };

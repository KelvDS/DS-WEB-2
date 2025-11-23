import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';

// Decide which DB engine to use
const dbType = process.env.DB_TYPE || 'sqlite';

let query;
let initDB;

if (dbType === 'postgres') {
  // ---------------- PostgreSQL Setup ----------------
  import pkg from 'pg';
  const { Pool } = pkg;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  query = (text, params = []) => pool.query(text, params);

  initDB = async () => {
    // Users
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('super','admin','client')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Galleries
    await query(`
      CREATE TABLE IF NOT EXISTS galleries (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Images
    await query(`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        gallery_id INTEGER NOT NULL REFERENCES galleries(id),
        filename TEXT NOT NULL,
        watermarked_filename TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Gallery Requests
    await query(`
      CREATE TABLE IF NOT EXISTS gallery_requests (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Client Galleries
    await query(`
      CREATE TABLE IF NOT EXISTS client_galleries (
        client_id INTEGER NOT NULL REFERENCES users(id),
        gallery_id INTEGER NOT NULL REFERENCES galleries(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (client_id, gallery_id)
      );
    `);

    // Favorites
    await query(`
      CREATE TABLE IF NOT EXISTS favorites (
        client_id INTEGER NOT NULL REFERENCES users(id),
        image_id INTEGER NOT NULL REFERENCES images(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (client_id, image_id)
      );
    `);

    // Selections
    await query(`
      CREATE TABLE IF NOT EXISTS selections (
        client_id INTEGER NOT NULL REFERENCES users(id),
        image_id INTEGER NOT NULL REFERENCES images(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (client_id, image_id)
      );
    `);

    // Highres Requests
    await query(`
      CREATE TABLE IF NOT EXISTS highres_requests (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES users(id),
        image_ids_json TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','delivered')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Approved Downloads
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

    // Seed Super Admin
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
  import sqlite3 from 'sqlite3';
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

    // … repeat for other tables (same schema as above)

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

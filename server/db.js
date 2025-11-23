import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'daperfect.db'));

export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export async function initDB() {
  await dbRun(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('super', 'admin', 'client')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS galleries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gallery_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    watermarked_filename TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gallery_id) REFERENCES galleries(id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS gallery_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS client_galleries (
    client_id INTEGER NOT NULL,
    gallery_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (client_id, gallery_id),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (gallery_id) REFERENCES galleries(id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS favorites (
    client_id INTEGER NOT NULL,
    image_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (client_id, image_id),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (image_id) REFERENCES images(id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS selections (
    client_id INTEGER NOT NULL,
    image_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (client_id, image_id),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (image_id) REFERENCES images(id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS highres_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    image_ids_json TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'delivered')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS approved_downloads (
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

  const superAdmin = await dbGet('SELECT * FROM users WHERE email = ?', ['kelvrambo@gmail.com']);
  if (!superAdmin) {
    const hash = bcrypt.hashSync('Kelv2580', 10);
    await dbRun('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)', 
      ['kelvrambo@gmail.com', hash, 'super']);
    console.log('✅ Super Admin created: kelvrambo@gmail.com');
  }
}

export default db;
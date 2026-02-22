import initSqlJs from 'sql.js';

// Initialize SQLite database
let db: any = null;

export const initDatabase = async () => {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => `/sql-wasm.wasm`
  });
  db = new SQL.Database();

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS study_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_data BLOB NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS generated_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      FOREIGN KEY (material_id) REFERENCES study_materials (id)
    )
  `);

  return db;
};

export const getDatabase = () => {
  if (!db) throw new Error('Database not initialized');
  return db;
};

export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
  }
};
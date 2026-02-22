import { getDatabase } from './database';

// Study materials operations
export const getStudyMaterials = () => {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM study_materials ORDER BY uploaded_at DESC');
  return result[0]?.values.map((row: any) => ({
    id: row[0],
    filename: row[1],
    file_type: row[2],
    file_size: row[3],
    file_data: row[4],
    uploaded_at: row[5],
  })) || [];
};

export const insertStudyMaterial = (filename: string, fileType: string, fileSize: number, fileData: Uint8Array) => {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO study_materials (filename, file_type, file_size, file_data) VALUES (?, ?, ?, ?)');
  const result = stmt.run([filename, fileType, fileSize, fileData]);
  stmt.free();
  return result.insertId;
};

export const deleteStudyMaterial = async (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM study_materials WHERE id = ?');
    
    try {
      stmt.run([id], function(err) {
        stmt.free();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (error) {
      stmt.free();
      reject(error);
    }
  });
};

// Generated questions operations
export const getGeneratedQuestions = (materialId: number) => {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM generated_questions WHERE material_id = ?', [materialId]);
  return result[0]?.values.map((row: any) => ({
    id: row[0],
    material_id: row[1],
    question_text: row[2],
    question_type: row[3],
    difficulty: row[4],
  })) || [];
};

export const insertGeneratedQuestion = (materialId: number, questionText: string, questionType: string, difficulty: string) => {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO generated_questions (material_id, question_text, question_type, difficulty) VALUES (?, ?, ?, ?)');
  stmt.run([materialId, questionText, questionType, difficulty]);
  stmt.free();
};
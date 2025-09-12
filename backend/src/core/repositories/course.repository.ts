import { pool } from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Course, CreateCourseDto, UpdateCourseDto } from '../models/Course';

export const courseRepository = {
  async create(data: CreateCourseDto): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO courses (course_id, title, description, price_yd, instructor_address, category, cover_image_url, tx_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.courseId,
        data.title || null,
        data.description || null,
        data.price?.toString() || null,
        data.instructorAddress || null,
        data.category || 'Web3',
        data.coverImageUrl || null,
        data.txHash || null
      ]
    );
    return result;
  },

  async createOrUpdate(data: CreateCourseDto): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO courses (course_id, title, description, price_yd, instructor_address, category, cover_image_url, tx_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       title = COALESCE(VALUES(title), title),
       description = COALESCE(VALUES(description), description),
       price_yd = COALESCE(VALUES(price_yd), price_yd),
       instructor_address = COALESCE(VALUES(instructor_address), instructor_address),
       category = COALESCE(VALUES(category), category),
       cover_image_url = COALESCE(VALUES(cover_image_url), cover_image_url),
       tx_hash = COALESCE(VALUES(tx_hash), tx_hash),
       updated_at = CURRENT_TIMESTAMP`,
      [
        data.courseId,
        data.title || null,
        data.description || null,
        data.price?.toString() || null,
        data.instructorAddress || null,
        data.category || 'Web3',
        data.coverImageUrl || null,
        data.txHash || null
      ]
    );
    return result;
  },

  async findById(id: number): Promise<Course | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );
    return (rows[0] as Course) || null;
  },

  async findByCourseId(courseId: number): Promise<Course | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM courses WHERE course_id = ?',
      [courseId]
    );
    return (rows[0] as Course) || null;
  },

  async findByCourseIdAndInstructor(courseId: number, address: string): Promise<Course | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM courses WHERE course_id = ? AND instructor_address = ?',
      [courseId, address]
    );
    return (rows[0] as Course) || null;
  },

  async findWithPagination(limit: number, offset: number): Promise<Course[]> {
    // 确保limit和offset是整数
    const safeLimit = Math.max(1, Math.floor(Number(limit)));
    const safeOffset = Math.max(0, Math.floor(Number(offset)));
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM courses ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );
    return rows as Course[];
  },

  async findByInstructor(instructorAddress: string, limit: number = 10, offset: number = 0): Promise<Course[]> {
    const safeLimit = Math.max(1, Math.floor(Number(limit)));
    const safeOffset = Math.max(0, Math.floor(Number(offset)));
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM courses WHERE instructor_address = ? ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [instructorAddress]
    );
    return rows as Course[];
  },

  async findByCategory(category: string, limit: number = 10, offset: number = 0): Promise<Course[]> {
    const safeLimit = Math.max(1, Math.floor(Number(limit)));
    const safeOffset = Math.max(0, Math.floor(Number(offset)));
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM courses WHERE category = ? ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [category]
    );
    return rows as Course[];
  },

  async countAll(): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM courses');
    return rows[0].total;
  },

  async countByInstructor(instructorAddress: string): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM courses WHERE instructor_address = ?',
      [instructorAddress]
    );
    return rows[0].total;
  },

  async countByCategory(category: string): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM courses WHERE category = ?',
      [category]
    );
    return rows[0].total;
  },

  async update(courseId: number, data: UpdateCourseDto): Promise<ResultSetHeader> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.price !== undefined) {
      fields.push('price_yd = ?');
      values.push(data.price.toString());
    }
    if (data.category !== undefined) {
      fields.push('category = ?');
      values.push(data.category);
    }
    if (data.coverImageUrl !== undefined) {
      fields.push('cover_image_url = ?');
      values.push(data.coverImageUrl);
    }
    if (data.txHash !== undefined) {
      fields.push('tx_hash = ?');
      values.push(data.txHash);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(courseId);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE courses SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE course_id = ?`,
      values
    );
    return result;
  },

  async delete(courseId: number): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM courses WHERE course_id = ?',
      [courseId]
    );
    return result;
  }
};
import { pool } from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Purchase, CreatePurchaseDto } from '../models/Purchase';

export const purchaseRepository = {
  async create(data: CreatePurchaseDto): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO purchases (user_address, course_id, tx_hash, price_paid) VALUES (?, ?, ?, ?)`,
      [data.userAddress, data.courseId, data.txHash, data.pricePaid?.toString() || null]
    );
    return result;
  },

  async findById(id: number): Promise<Purchase | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM purchases WHERE id = ?',
      [id]
    );
    return (rows[0] as Purchase) || null;
  },

  async findByUserAddress(userAddress: string): Promise<Purchase[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM purchases WHERE user_address = ? ORDER BY created_at DESC',
      [userAddress]
    );
    return rows as Purchase[];
  },

  async findByCourseId(courseId: number): Promise<Purchase[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM purchases WHERE course_id = ? ORDER BY created_at DESC',
      [courseId]
    );
    return rows as Purchase[];
  },

  async findByUserAndCourse(userAddress: string, courseId: number): Promise<Purchase | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM purchases WHERE user_address = ? AND course_id = ? ORDER BY created_at DESC LIMIT 1',
      [userAddress, courseId]
    );
    return (rows[0] as Purchase) || null;
  },

  async findByTxHash(txHash: string): Promise<Purchase | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM purchases WHERE tx_hash = ?',
      [txHash]
    );
    return (rows[0] as Purchase) || null;
  },

  async exists(userAddress: string, courseId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM purchases WHERE user_address = ? AND course_id = ?',
      [userAddress, courseId]
    );
    return rows[0].count > 0;
  },

  async countByUser(userAddress: string): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM purchases WHERE user_address = ?',
      [userAddress]
    );
    return rows[0].total;
  },

  async countByCourse(courseId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM purchases WHERE course_id = ?',
      [courseId]
    );
    return rows[0].total;
  },

  async findWithPagination(limit: number, offset: number): Promise<Purchase[]> {
    const safeLimit = Math.max(1, Math.floor(Number(limit)));
    const safeOffset = Math.max(0, Math.floor(Number(offset)));
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM purchases ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );
    return rows as Purchase[];
  },

  async findUserPurchasesWithPagination(
    userAddress: string, 
    limit: number, 
    offset: number
  ): Promise<Purchase[]> {
    const safeLimit = Math.max(1, Math.floor(Number(limit)));
    const safeOffset = Math.max(0, Math.floor(Number(offset)));
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM purchases WHERE user_address = ? ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [userAddress]
    );
    return rows as Purchase[];
  },

  async delete(id: number): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM purchases WHERE id = ?',
      [id]
    );
    return result;
  }
};
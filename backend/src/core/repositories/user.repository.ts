import { pool } from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { User, CreateUserDto, UpdateUserDto } from '../models/User';

export const userRepository = {
  async create(data: CreateUserDto): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (wallet_address, nickname, bio) VALUES (?, ?, ?)`,
      [data.walletAddress, data.nickname || null, data.bio || null]
    );
    return result;
  },

  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE wallet_address = ?',
      [walletAddress]
    );
    return (rows[0] as User) || null;
  },

  async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return (rows[0] as User) || null;
  },

  async update(walletAddress: string, data: UpdateUserDto): Promise<ResultSetHeader> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(data.nickname);
    }
    if (data.bio !== undefined) {
      fields.push('bio = ?');
      values.push(data.bio);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(walletAddress);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE users SET ${fields.join(', ')} WHERE wallet_address = ?`,
      values
    );
    return result;
  },

  async createOrUpdate(data: CreateUserDto): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (wallet_address, nickname, bio) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       nickname = COALESCE(VALUES(nickname), nickname),
       bio = COALESCE(VALUES(bio), bio),
       updated_at = CURRENT_TIMESTAMP`,
      [data.walletAddress, data.nickname || null, data.bio || null]
    );
    return result;
  },

  async delete(walletAddress: string): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM users WHERE wallet_address = ?',
      [walletAddress]
    );
    return result;
  }
};
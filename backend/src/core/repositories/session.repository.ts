import { pool } from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { 
  UserSession, 
  CreateSessionDto, 
  CourseAccessToken, 
  CreateCourseAccessTokenDto 
} from '../models/Session';

export const sessionRepository = {
  // User Sessions
  async createSession(data: CreateSessionDto): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO user_sessions (user_address, session_token, expires_at) VALUES (?, ?, ?)`,
      [data.userAddress, data.sessionToken, data.expiresAt]
    );
    return result;
  },

  async findSessionByToken(sessionToken: string): Promise<UserSession | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user_sessions WHERE session_token = ? AND expires_at > NOW()',
      [sessionToken]
    );
    return (rows[0] as UserSession) || null;
  },

  async findSessionsByUser(userAddress: string): Promise<UserSession[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user_sessions WHERE user_address = ? ORDER BY created_at DESC',
      [userAddress]
    );
    return rows as UserSession[];
  },

  async updateSession(sessionToken: string, expiresAt: Date): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE user_sessions SET expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE session_token = ?',
      [expiresAt, sessionToken]
    );
    return result;
  },

  async deleteSession(sessionToken: string): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM user_sessions WHERE session_token = ?',
      [sessionToken]
    );
    return result;
  },

  async deleteUserSessions(userAddress: string): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM user_sessions WHERE user_address = ?',
      [userAddress]
    );
    return result;
  },

  async cleanExpiredSessions(): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM user_sessions WHERE expires_at <= NOW()'
    );
    return result;
  },

  // Course Access Tokens
  async createCourseAccessToken(data: CreateCourseAccessTokenDto): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO course_access_tokens (user_address, course_id, signature, signed_message, expires_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       signature = VALUES(signature),
       signed_message = VALUES(signed_message),
       expires_at = VALUES(expires_at),
       created_at = CURRENT_TIMESTAMP`,
      [data.userAddress, data.courseId, data.signature, data.signedMessage, data.expiresAt]
    );
    return result;
  },

  async findCourseAccessToken(userAddress: string, courseId: number): Promise<CourseAccessToken | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM course_access_tokens WHERE user_address = ? AND course_id = ? AND expires_at > NOW()',
      [userAddress, courseId]
    );
    return (rows[0] as CourseAccessToken) || null;
  },

  async findUserCourseAccessTokens(userAddress: string): Promise<CourseAccessToken[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM course_access_tokens WHERE user_address = ? ORDER BY created_at DESC',
      [userAddress]
    );
    return rows as CourseAccessToken[];
  },

  async deleteCourseAccessToken(userAddress: string, courseId: number): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM course_access_tokens WHERE user_address = ? AND course_id = ?',
      [userAddress, courseId]
    );
    return result;
  },

  async deleteUserCourseAccessTokens(userAddress: string): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM course_access_tokens WHERE user_address = ?',
      [userAddress]
    );
    return result;
  },

  async cleanExpiredCourseAccessTokens(): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM course_access_tokens WHERE expires_at <= NOW()'
    );
    return result;
  },

  async validateCourseAccess(
    userAddress: string, 
    courseId: number, 
    signature: string
  ): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM course_access_tokens 
       WHERE user_address = ? AND course_id = ? AND signature = ? AND expires_at > NOW()`,
      [userAddress, courseId, signature]
    );
    return rows[0].count > 0;
  }
};
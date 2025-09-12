export interface UserSession {
  id: number;
  user_address: string;
  session_token: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSessionDto {
  userAddress: string;
  sessionToken: string;
  expiresAt: Date;
}

export interface CourseAccessToken {
  id: number;
  user_address: string;
  course_id: number;
  signature: string;
  signed_message: string;
  expires_at: Date;
  created_at: Date;
}

export interface CreateCourseAccessTokenDto {
  userAddress: string;
  courseId: number;
  signature: string;
  signedMessage: string;
  expiresAt: Date;
}
export interface User {
  id: number;
  wallet_address: string;
  nickname?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  walletAddress: string;
  nickname?: string;
  bio?: string;
}

export interface UpdateUserDto {
  nickname?: string;
  bio?: string;
}
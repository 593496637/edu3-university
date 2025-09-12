export const API_BASE_URL = 'http://localhost:3001/api';

export const CONTRACT_ADDRESSES = {
  YDToken: '0x752250B9471b77e85c3DE330db8a5d7802Eb87d7',
  CourseManager: '0xCb4A483c8F1F84BF0128a7081c0d4FC4A2607EE7',
  SimpleStaking: '0xf5924164C4685f650948bf4a51124f0CB24DA026'
} as const;

export const NETWORK_CONFIG = {
  SEPOLIA_CHAIN_ID: 11155111,
  SUPPORTED_NETWORKS: [11155111],
} as const;

export const TOKEN_CONFIG = {
  DECIMALS: 18,
  SYMBOL: 'YD',
  NAME: 'YDToken',
} as const;
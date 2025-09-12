export const API_BASE_URL = 'http://localhost:3001/api';

export const CONTRACT_ADDRESSES = {
  YDToken: '0x752250B9471b77e85c3DE330db8a5d7802Eb87d7',
  CourseManager: '0xCb4A483c8F1F84BF0128a7081c0d4FC4A2607EE7',
  SimpleStaking: '0xf5924164C4685f650948bf4a51124f0CB24DA026'
} as const;

export const NETWORK_CONFIG = {
  SEPOLIA_CHAIN_ID: 11155111,
  SEPOLIA_CHAIN_ID_HEX: '0xaa36a7',
  SEPOLIA_RPC: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  SUPPORTED_NETWORKS: [11155111],
} as const;

export const TOKEN_CONFIG = {
  DECIMALS: 18,
  SYMBOL: 'YD',
  NAME: 'YDToken',
} as const;

// UI Constants
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  SIGNATURE_CACHE_EXPIRY_BUFFER_MS: 5 * 60 * 1000, // 5 minutes
  COURSE_ACCESS_TOKEN_DURATION_MS: 2 * 60 * 60 * 1000, // 2 hours
  NONCE_CLEANUP_INTERVAL_MS: 2 * 60 * 1000, // 2 minutes
  ADDRESS_DISPLAY_LENGTH: {
    PREFIX: 6,
    SUFFIX: 4
  }
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_INSTALLED: '请安装 MetaMask!',
  WALLET_CONNECTION_FAILED: '连接钱包失败',
  INVALID_ADDRESS: '请输入有效的以太坊地址',
  INVALID_AMOUNT: '请输入有效的代币数量',
  INSUFFICIENT_PERMISSIONS: '请检查权限和参数',
  LOGIN_REQUIRED: '请先连接钱包',
  MINT_FAILED: '发放代币失败',
  COURSE_ACCESS_FAILED: '生成课程访问消息失败'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  TOKEN_MINT_SUCCESS: '代币发放成功',
  WALLET_CONNECTED: '钱包连接成功',
  BACKEND_CONNECTION_SUCCESS: '后端连接成功'
} as const;
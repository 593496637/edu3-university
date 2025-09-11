import express from 'express';
import { ethers } from 'ethers';
import { sessionService } from '../services/sessionService';
import { nonceService } from '../services/nonceService';

const router = express.Router();

// 登录接口 - 钱包签名验证 (支持nonce机制)
router.post('/login', async (req, res) => {
  try {
    const { walletAddress, signature, message, timestamp, nonce } = req.body;

    if (!walletAddress || !signature || !message || !timestamp) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }

    // 如果提供了nonce，进行nonce验证（增强安全性）
    if (nonce) {
      const nonceValid = nonceService.validateAndConsumeNonce(nonce, walletAddress);
      if (!nonceValid) {
        return res.status(401).json({
          success: false,
          error: 'Nonce验证失败或已过期'
        });
      }
    }

    // 验证时间戳 (5分钟内有效)
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - timestamp);
    if (timeDiff > 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        error: '登录请求已过期'
      });
    }

    // 验证签名
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({
          success: false,
          error: '签名验证失败'
        });
      }

      // 创建用户会话 (24小时有效期)
      const sessionToken = await sessionService.createSession(walletAddress, 24);

      res.json({
        success: true,
        data: {
          sessionToken,
          walletAddress: walletAddress.toLowerCase(),
          expiresIn: 24 * 60 * 60 * 1000 // 24小时，毫秒
        },
        message: '登录成功'
      });

    } catch (signatureError) {
      console.error('签名验证错误:', signatureError);
      return res.status(401).json({
        success: false,
        error: '签名格式无效'
      });
    }

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      error: '登录失败'
    });
  }
});

// 验证会话接口
router.post('/verify-session', async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        error: '缺少session token'
      });
    }

    const userAddress = await sessionService.validateSession(sessionToken);

    if (!userAddress) {
      return res.status(401).json({
        success: false,
        error: '会话已过期或无效'
      });
    }

    res.json({
      success: true,
      data: {
        userAddress,
        isValid: true
      }
    });

  } catch (error) {
    console.error('验证会话失败:', error);
    res.status(500).json({
      success: false,
      error: '会话验证失败'
    });
  }
});

// 登出接口
router.post('/logout', async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (sessionToken) {
      await sessionService.deleteSession(sessionToken);
    }

    res.json({
      success: true,
      message: '登出成功'
    });

  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({
      success: false,
      error: '登出失败'
    });
  }
});

export default router;
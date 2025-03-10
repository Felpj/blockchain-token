const express = require('express');
const walletController = require('./wallet.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/details', authMiddleware, walletController.getWalletDetails);
router.post('/send', authMiddleware, walletController.sendTokens);
router.get('/receive', authMiddleware, walletController.getReceiveDetails);

module.exports = router; 
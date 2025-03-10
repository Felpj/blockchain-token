const express = require('express');
const walletController = require('./wallet.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas da carteira
router.get('/details', walletController.getWalletDetails);
router.post('/send', walletController.sendTokens);
router.get('/receive-details', walletController.getReceiveDetails);

module.exports = router; 
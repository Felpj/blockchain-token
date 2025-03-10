const express = require('express');
const transactionsController = require('./transactions.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();


// Compra de tokens
router.post('/purchase', authMiddleware, transactionsController.createPurchase);

// Histórico de transações
router.get('/history', authMiddleware, transactionsController.getTransactions);

// Verificar status da transação (sem auth para debug)
router.get('/:id/check', transactionsController.checkTransactionStatus);

// Buscar transação específica
router.get('/:id', authMiddleware, transactionsController.getTransactionById);

// Webhook PIX
router.post('/pix-webhook', transactionsController.handlePixWebhook);

module.exports = router; 
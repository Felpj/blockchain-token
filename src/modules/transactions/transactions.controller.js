const transactionsService = require('./transactions.service');
const prisma = require('../../config/database');

const transactionsController = {
    async createPurchase(req, res) {
        try {
            const { amount, destinationAddress } = req.body;
            // if (!amount || amount < 10) {
            //     return res.status(400).json({ error: 'Valor mínimo de R$ 10' });
            // }

            const purchase = await transactionsService.createPurchase(
                req.user.id, 
                amount,
                destinationAddress // Endereço opcional
            );
            return res.json(purchase);
        } catch (error) {
            console.error('Erro ao criar compra:', error);
            return res.status(400).json({ error: error.message });
        }
    },

    async getTransactions(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            const result = await transactionsService.getTransactions(req.user.id, page, limit);
            
            return res.json({
                success: true,
                data: result.transactions,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
            return res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    async getTransactionById(req, res) {
        try {
            const { id } = req.params;
            const transaction = await transactionsService.getTransactionById(req.user.id, id);
            
            // Retorna informações mais detalhadas sobre o status
            return res.json({
                id: transaction.id,
                status: transaction.status,
                amount: transaction.amount,
                tokenAmount: transaction.tokenAmount,
                txHash: transaction.txHash,
                paymentId: transaction.paymentId,
                qrCode: transaction.qrCode,
                paymentString: transaction.paymentString,
                isPaid: transaction.status === 'COMPLETED' || transaction.status === 'PAID',
                paymentConfirmed: Boolean(transaction.paidAt),
                paidAt: transaction.paidAt,
                createdAt: transaction.createdAt
            });
        } catch (error) {
            console.error('Erro ao buscar transação:', error);
            return res.status(400).json({ error: error.message });
        }
    },

    // Novo método para webhook
    async handlePixWebhook(req, res) {
        try {
            console.log('Webhook PIX recebido:', req.body);
            
            const { identifier, amount } = req.body;
            
            // Confirma a transação usando o identifier (nosso paymentId)
            const updatedTransaction = await transactionsService.confirmTransaction(identifier);
            
            // Log mais detalhado
            console.log('Transação confirmada:', {
                id: updatedTransaction.id,
                status: updatedTransaction.status,
                amount: amount,
                paidAt: updatedTransaction.paidAt
            });

            return res.json({ success: true });
        } catch (error) {
            console.error('Erro ao processar webhook PIX:', error);
            return res.status(400).json({ error: error.message });
        }
    },

    async getPixStatus(req, res) {
        try {
            const { id } = req.params;
            const transaction = await transactionsService.getTransactionById(req.user.id, id);
            
            // Se a transação estiver completa, retornamos os dados do webhook
            if (transaction.status === 'COMPLETED') {
                return res.json({
                    type: 'pix',
                    event: 'transfer',
                    amount: transaction.amount.toString(),
                    id: transaction.id,
                    transactionId: transaction.id,
                    identifier: transaction.paymentId,
                    txHash: transaction.txHash
                });
            }

            // Se ainda estiver pendente, retorna sem o identifier
            return res.json({
                type: 'pix',
                event: 'transfer',
                amount: transaction.amount.toString(),
                id: transaction.id,
                transactionId: transaction.id
            });
        } catch (error) {
            console.error('Erro ao buscar status do PIX:', error);
            return res.status(400).json({ error: error.message });
        }
    },

    async checkTransactionStatus(req, res) {
        try {
            const { id } = req.params;
            console.log('Verificando transação:', id);

            // Tenta encontrar por id ou paymentId
            const transaction = await prisma.transaction.findFirst({
                where: {
                    OR: [
                        { id },
                        { paymentId: id }
                    ]
                }
            });

            if (!transaction) {
                console.log('Transação não encontrada:', id);
                return res.status(404).json({ error: 'Transação não encontrada' });
            }

            console.log('Transação encontrada:', transaction);
            
            return res.json({
                status: transaction.status,
                amount: transaction.amount,
                txHash: transaction.txHash
            });
        } catch (error) {
            console.error('Erro ao verificar transação:', error);
            return res.status(500).json({ error: 'Erro ao verificar transação' });
        }
    },

    async checkTransaction(req, res) {
        try {
            const { id } = req.params;
            console.log('Verificando transação:', id);

            // Tenta encontrar por id ou paymentId
            const transaction = await prisma.transaction.findFirst({
                where: {
                    OR: [
                        { id },
                        { paymentId: id }
                    ]
                }
            });

            if (!transaction) {
                console.log('Transação não encontrada:', id);
                return res.status(404).json({ error: 'Transação não encontrada' });
            }

            console.log('Transação encontrada:', transaction);
            
            return res.json({
                status: transaction.status,
                amount: transaction.amount,
                txHash: transaction.txHash
            });
        } catch (error) {
            console.error('Erro ao verificar transação:', error);
            return res.status(500).json({ error: 'Erro ao verificar transação' });
        }
    }
};

module.exports = transactionsController; 
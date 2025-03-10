const transactionsService = require('./transactions.service');

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
            const transactions = await transactionsService.getTransactions(req.user.id);
            return res.json({
                success: true,
                data: transactions
            });
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
            return res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // Novo método para webhook
    async handlePixWebhook(req, res) {
        try {
            console.log('Webhook PIX recebido:', req.body);
            
            // Validamos se é uma transferência PIX de entrada
            if (req.body.type !== 'pix' || req.body.event !== 'transfer' || req.body.side !== 'in') {
                return res.json({ success: false, message: 'Evento não relevante' });
            }

            const { identifier, amount } = req.body;
            
            // Confirma a transação usando o identifier (nosso paymentId)
            const updatedTransaction = await transactionsService.confirmTransaction(identifier);
            console.log('Transação confirmada:', updatedTransaction.id, 'Valor:', amount);

            return res.json({ success: true });
        } catch (error) {
            console.error('Erro ao processar webhook PIX:', error);
            return res.status(400).json({ error: error.message });
        }
    }
};

module.exports = transactionsController; 
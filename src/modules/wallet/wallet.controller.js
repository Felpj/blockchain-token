const walletService = require('./wallet.service');
const authService = require('../auth/auth.service');
const bcrypt = require('bcrypt');

const walletController = {
    async getWalletDetails(req, res) {
        try {
            const details = await walletService.getWalletDetails(req.user.id);
            return res.json(details);
        } catch (error) {
            console.error('Erro ao buscar detalhes da carteira:', error);
            return res.status(400).json({ error: error.message });
        }
    },

    async sendTokens(req, res) {
        try {
            const { amount, destinationAddress, password } = req.body;

            // Validações
            if (!amount || !destinationAddress || !password) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Quantidade, endereço e senha são obrigatórios' 
                });
            }

            // Verificar senha
            const user = await authService.findUserById(req.user.id);
            const passwordValid = await bcrypt.compare(password, user.password);
            
            if (!passwordValid) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Senha inválida' 
                });
            }

            const result = await walletService.sendTokens(
                req.user.id,
                amount,
                destinationAddress
            );

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Erro ao enviar tokens:', error);
            return res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    async getReceiveDetails(req, res) {
        try {
            const details = await walletService.getReceiveDetails(req.user.id);
            return res.json({
                success: true,
                data: details
            });
        } catch (error) {
            console.error('Erro ao buscar detalhes para recebimento:', error);
            return res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
};

module.exports = walletController; 
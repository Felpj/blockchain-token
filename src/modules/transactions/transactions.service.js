const prisma = require('../../config/database');
const axios = require('axios');
const crypto = require('crypto');
const contractService = require('../contract/contract.service');
const BSC_TESTNET_EXPLORER = 'https://testnet.bscscan.com/tx/';

const PIX_API_URL = 'http://vps80270.cloudpublic.com.br/api/b8cash/gerarQrCodeDeposito';
const ACCOUNT_NUMBER = 8734873;
const API_KEY = '75eaee07-fcbd-4b8e-8541-cb9e4b70e03e';

const transactionsService = {

    generatePaymentId() {
        // Gera ID no formato FB + 5 caracteres aleatórios
        const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
        return `FB${random}`;
    },

    async generatePayment(amount) {
        try {
            const paymentId = this.generatePaymentId();

            const response = await axios.post(PIX_API_URL, {
                accountNumber: ACCOUNT_NUMBER,
                key: API_KEY,
                value: amount,
                id: paymentId
            });

            return {
                paymentId,
                qrCode: response.data.response.qrCode,
                paymentString: response.data.response.paymentString,
                message: response.data.mensagem
            };
        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            throw new Error('Erro ao gerar pagamento PIX');
        }
    },

    async createPurchase(userId, amount, destinationAddress) {
        // Buscar carteira do usuário
        const wallet = await prisma.wallet.findUnique({
            where: { userId }
        });

        if (!wallet) {
            throw new Error('Carteira não encontrada');
        }

        // Se não foi fornecido endereço de destino, usa a carteira do usuário
        const toAddress = destinationAddress || wallet.address;

        // Validar endereço de destino (formato hexadecimal de 40 caracteres)
        if (!toAddress.match(/^[0-9a-fA-F]{40}$/)) {
            throw new Error('Endereço de carteira inválido');
        }

        const tokenAmount = amount / 2.38;
        const pixPayment = await this.generatePayment(amount);

        // Criar transação
        const transaction = await prisma.transaction.create({
            data: {
                userId,
                type: 'PURCHASE',
                amount,
                tokenAmount,
                status: 'PENDING',
                toAddress, // Usando o endereço escolhido ou da carteira do usuário
                walletId: wallet.id,
                pixCode: pixPayment.paymentString,
                paymentId: pixPayment.paymentId
            }
        });

        return {
            ...transaction,
            qrCode: pixPayment.qrCode,
            paymentString: pixPayment.paymentString,
            message: pixPayment.message
        };
    },

    async getTransactions(userId) {
        try {
            const transactions = await prisma.transaction.findMany({
                where: { 
                    userId,
                    type: 'PURCHASE' // Filtrando apenas compras de HX1000
                },
                orderBy: {
                    createdAt: 'desc' // Mais recentes primeiro
                },
                include: {
                    wallet: true
                }
            });

            return transactions.map(tx => {
                // Formatar endereço para exibição (primeiros e últimos caracteres)
                const formatAddress = (address) => {
                    if (!address) return '';
                    address = address.startsWith('0x') ? address : `0x${address}`;
                    return `${address.slice(0, 6)}...${address.slice(-4)}`;
                };

                // Formatar data para o padrão brasileiro
                const formatDate = (date) => {
                    return new Date(date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                };

                // Formatar status para português
                const formatStatus = (status) => {
                    const statusMap = {
                        'PENDING': 'Pendente',
                        'COMPLETED': 'Concluído',
                        'FAILED': 'Falhou'
                    };
                    return statusMap[status] || status;
                };

                return {
                    ref: tx.paymentId || tx.id.slice(0, 8),
                    descricao: `${tx.tokenAmount.toFixed(8)} HX1000 tokens para ${formatAddress(tx.toAddress)}`,
                    total: `R$ ${tx.amount.toFixed(2)}`,
                    data: formatDate(tx.createdAt),
                    status: formatStatus(tx.status),
                    // Dados adicionais que podem ser úteis
                    detalhes: {
                        txHash: tx.txHash,
                        bscScanUrl: tx.txHash ? `https://testnet.bscscan.com/tx/${tx.txHash}` : null,
                        error: tx.error
                    }
                };
            });
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
            throw new Error('Erro ao buscar histórico de transações');
        }
    },

    async confirmTransaction(paymentId) {
        const transaction = await this.findTransactionByPaymentId(paymentId);
        
        if (!transaction) {
            throw new Error('Transação não encontrada');
        }

        try {
            // Enviar tokens usando o smart contract
            const txHash = await contractService.distributeTokens(
                transaction.toAddress,
                transaction.tokenAmount,
                paymentId // Passando o paymentId como referência
            );

            // Atualizar a transação com o hash
            const updatedTransaction = await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'COMPLETED',
                    txHash: txHash
                }
            });

            return {
                ...updatedTransaction,
                explorerUrl: BSC_TESTNET_EXPLORER + txHash
            };
        } catch (error) {
            console.error('Erro ao confirmar transação:', error);
            
            // Atualizar transação com status de erro
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'FAILED',
                    error: error.message
                }
            });

            throw new Error('Erro ao processar transferência de tokens');
        }
    },

    async findTransactionByPaymentId(paymentId) {
        return await prisma.transaction.findFirst({
            where: {
                paymentId: paymentId
            }
        });
    }
};

module.exports = transactionsService; 
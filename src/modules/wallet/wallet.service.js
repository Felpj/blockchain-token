const prisma = require('../../config/database');
const crypto = require('crypto');
const ethers = require('ethers');
const contractABI = require('../contract/contractABI.json');
const QRCode = require('qrcode');
const { PrismaClient } = require('@prisma/client');

const CONTRACT_ADDRESS = '0x952b1bEF2a3d64c61531168E79194Ce11bC2e1bf';
const BSC_TESTNET_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545/';

const walletService = {
    async createWallet(userId) {
        // Gerar endereço e chave privada (simplificado para teste)
        const privateKey = crypto.randomBytes(32).toString('hex');
        const address = crypto.randomBytes(20).toString('hex');

        const wallet = await prisma.wallet.create({
            data: {
                userId,
                address,
                privateKey, // Em produção, isso deve ser encriptado
                balance: 0
            }
        });

        return wallet;
    },

    async getWallet(userId) {
        return await prisma.wallet.findUnique({
            where: { userId }
        });
    },

    async getWalletDetails(userId) {
        try {
            const wallet = await prisma.wallet.findUnique({
                where: { userId }
            });

            if (!wallet) {
                throw new Error('Carteira não encontrada');
            }

            const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                contractABI,
                provider
            );

            // Adicionar '0x' se necessário
            const formattedAddress = wallet.address.startsWith('0x') 
                ? wallet.address 
                : `0x${wallet.address}`;

            // Buscar saldo de tokens
            const balance = await contract.balanceOf(formattedAddress);

            return {
                address: formattedAddress,
                balance: ethers.formatUnits(balance, 18), // Converter para número legível
                bscScanUrl: `https://testnet.bscscan.com/address/${formattedAddress}`,
                tokenUrl: `https://testnet.bscscan.com/token/${CONTRACT_ADDRESS}?a=${formattedAddress}`
            };
        } catch (error) {
            console.error('Erro ao buscar detalhes da carteira:', error);
            throw error;
        }
    },

    async sendTokens(userId, amount, destinationAddress) {
        try {
            // Buscar carteira do usuário
            const wallet = await prisma.wallet.findUnique({
                where: { userId }
            });

            if (!wallet) {
                throw new Error('Carteira não encontrada');
            }

            // Formatar endereços
            const fromAddress = wallet.address.startsWith('0x') ? wallet.address : `0x${wallet.address}`;
            const toAddress = destinationAddress.startsWith('0x') ? destinationAddress : `0x${destinationAddress}`;

            // Validar endereço de destino
            if (!toAddress.match(/^0x[0-9a-fA-F]{40}$/)) {
                throw new Error('Endereço de carteira inválido');
            }

            const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
            const signer = new ethers.Wallet(wallet.privateKey, provider);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

            // Verificar saldo de tokens
            const tokenAmount = ethers.parseUnits(amount.toString(), 18);
            const balance = await contract.balanceOf(fromAddress);

            console.log('Verificação de saldo:', {
                saldoAtual: ethers.formatUnits(balance, 18),
                tentandoEnviar: amount,
                carteira: fromAddress
            });

            if (balance < tokenAmount) {
                throw new Error(`Saldo insuficiente. Você tem ${ethers.formatUnits(balance, 18)} HX1000 e está tentando enviar ${amount} HX1000`);
            }

            // Verificar saldo de BNB para gas
            const bnbBalance = await provider.getBalance(fromAddress);
            const feeData = await provider.getFeeData(); // Novo método para obter gas price
            const gasLimit = 100000n; // Usando BigInt
            const gasCost = feeData.gasPrice * gasLimit;

            console.log('Verificação de BNB:', {
                saldoBNB: ethers.formatEther(bnbBalance),
                custoEstimado: ethers.formatEther(gasCost),
                gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei') + ' gwei'
            });

            if (bnbBalance < gasCost) {
                const custoEstimadoBNB = ethers.formatEther(gasCost);
                throw new Error(`Saldo de BNB insuficiente para taxa de transação. Necessário aproximadamente ${custoEstimadoBNB} BNB`);
            }

            console.log('Enviando tokens:', {
                de: fromAddress,
                para: toAddress,
                quantidade: amount,
                tokenAmount: ethers.formatUnits(tokenAmount, 18)
            });

            // Enviar tokens
            const tx = await contract.transfer(
                toAddress,
                tokenAmount,
                {
                    gasLimit: gasLimit
                }
            );

            console.log('Transação enviada:', tx.hash);
            const receipt = await tx.wait();
            console.log('Transação confirmada!');

            // Criar registro da transação
            const transaction = await prisma.transaction.create({
                data: {
                    userId,
                    type: 'SEND',
                    amount: parseFloat(amount),
                    tokenAmount: parseFloat(amount),
                    status: 'COMPLETED',
                    fromAddress,
                    toAddress,
                    txHash: receipt.hash,
                    walletId: wallet.id
                }
            });

            return {
                success: true,
                transaction,
                txHash: receipt.hash,
                explorerUrl: `https://testnet.bscscan.com/tx/${receipt.hash}`
            };
        } catch (error) {
            console.error('Detalhes do erro:', error);

            // Tratamento de erros específicos
            let mensagemErro = 'Erro ao enviar tokens: ';
            if (error.message.includes('insufficient funds')) {
                mensagemErro += 'Saldo de BNB insuficiente para pagar a taxa de transação';
            } else if (error.code === 'CALL_EXCEPTION') {
                mensagemErro += 'Erro na execução do contrato. Verifique o saldo e o endereço de destino';
            } else {
                mensagemErro += error.message;
            }

            throw new Error(mensagemErro);
        }
    },

    async getReceiveDetails(userId) {
        try {
            const wallet = await prisma.wallet.findUnique({
                where: { userId }
            });

            if (!wallet) {
                throw new Error('Carteira não encontrada');
            }

            const address = wallet.address.startsWith('0x') 
                ? wallet.address 
                : `0x${wallet.address}`;

            // Gerar QR code
            const qrCodeData = await QRCode.toDataURL(address);
            const qrCode = qrCodeData.split(',')[1]; // Remove o prefixo data:image/png;base64,

            return {
                address,
                qrCode,
                explorerUrl: `https://testnet.bscscan.com/address/${address}`
            };
        } catch (error) {
            console.error('Erro ao gerar QR code:', error);
            throw error;
        }
    },

    async generateReceiveQRCode(userId) {
        try {
            // Busca a carteira do usuário
            const wallet = await prisma.wallet.findUnique({
                where: { userId }
            });

            if (!wallet) {
                throw new Error('Carteira não encontrada');
            }

            // Gera o QR code do endereço
            const qrCode = await QRCode.toDataURL(wallet.address);

            return {
                address: wallet.address,
                qrCode: qrCode.split(',')[1] // Remove o prefixo data:image/png;base64,
            };
        } catch (error) {
            console.error('Erro ao gerar QR code:', error);
            throw error;
        }
    }
};

module.exports = walletService; 
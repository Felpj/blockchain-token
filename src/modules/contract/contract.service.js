const ethers = require('ethers');
const contractABI = require('./contractABI.json');

const CONTRACT_ADDRESS = '0x952b1bEF2a3d64c61531168E79194Ce11bC2e1bf'; // Endereço correto do HX1000
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Usando a chave que já existe
const BSC_TESTNET_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545/'; // RPC da BSC Testnet

const contractService = {
    async distributeTokens(toAddress, amount, paymentId) {
        try {
            // Conectar à BSC Testnet
            const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
            
            // Criar wallet com a chave privada
            const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
            
            // Conectar ao contrato
            const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
            
            // Adicionar '0x' se não existir
            const formattedAddress = toAddress.startsWith('0x') ? toAddress : `0x${toAddress}`;
            
            // Converter o amount para a precisão correta (18 decimais)
            const tokenAmount = ethers.parseUnits(amount.toString(), 18);
            
            console.log(`Distribuindo ${amount} tokens para ${formattedAddress}`);
            // Usando a função distributeTokens específica do HX1000
            const tx = await contract.distributeTokens(
                formattedAddress,
                tokenAmount,
                paymentId // Referência do PIX
            );
            
            console.log('Transaction hash:', tx.hash);
            // Aguardar a confirmação
            const receipt = await tx.wait();
            
            return receipt.hash;
        } catch (error) {
            console.error('Erro ao distribuir tokens:', error);
            throw new Error('Falha ao enviar tokens: ' + error.message);
        }
    }
};

module.exports = contractService; 
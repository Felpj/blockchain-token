const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// Atualizando para o endereço correto do HX1000
const CONTRACT_ADDRESS = '0x952b1bEF2a3d64c61531168E79194Ce11bC2e1bf';
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;

async function getContractABI() {
    try {
        const url = `https://api-testnet.bscscan.com/api`;
        console.log('Buscando ABI para contrato HX1000:', CONTRACT_ADDRESS);

        const response = await axios.get(url, {
            params: {
                module: 'contract',
                action: 'getabi',
                address: CONTRACT_ADDRESS,
                apikey: BSCSCAN_API_KEY
            }
        });

        console.log('Resposta da API:', response.data);

        if (response.data.status === '1' && response.data.result) {
            const abi = JSON.parse(response.data.result);
            
            if (!fs.existsSync('./src/modules/contract')) {
                fs.mkdirSync('./src/modules/contract', { recursive: true });
            }

            fs.writeFileSync(
                './src/modules/contract/contractABI.json',
                JSON.stringify(abi, null, 2)
            );

            console.log('ABI do HX1000 salvo com sucesso!');
        } else {
            console.error('Erro ao buscar ABI:', response.data.message || response.data.result);
        }
    } catch (error) {
        console.error('Erro ao fazer requisição:', error.message);
    }
}

getContractABI(); 
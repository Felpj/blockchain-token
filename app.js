const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require("./src/modules/auth/auth.routes");
const inviteRoutes = require("./src/modules/invites/invites.routes");
const transactionsRoutes = require("./src/modules/transactions/transactions.routes");
const walletRoutes = require('./src/modules/wallet/wallet.routes');

//require('./src/config/database');

dotenv.config();

const app = express();

// Configuração do CORS
app.use(cors({
  origin: ['http://localhost:8080', 'https://globally-picked-skylark.ngrok-free.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/invites', inviteRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/wallet', walletRoutes);


// Rota básica para teste
app.get('/', (req, res) => {
  console.log('Acessando rota raiz');
  res.json({ message: 'API HX1000 funcionando!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
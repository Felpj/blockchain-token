const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require("./src/modules/auth/auth.routes");

//require('./src/config/database');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes)



// Rota básica para teste
app.get('/', (req, res) => {
  console.log('Acessando rota raiz');
  res.json({ message: 'API HX1000 funcionando!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
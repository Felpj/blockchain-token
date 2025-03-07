const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Teste de conexão
prisma.$connect()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });

module.exports = prisma; 
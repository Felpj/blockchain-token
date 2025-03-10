const prisma = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const invitesService = require('../invites/invites.service');
const walletService = require('../wallet/wallet.service');
const crypto = require('crypto');

const authService = {
    async register(userData) {
        const { email, password, whatsapp, invite } = userData;

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw new Error('Email já cadastrado');
        }

        const inviteRecord = await invitesService.validateInvite(invite);
        const hashedPassword = await bcrypt.hash(password, 10);

        // Gerar dados da carteira
        const privateKey = crypto.randomBytes(32).toString('hex');
        const walletAddress = crypto.randomBytes(20).toString('hex');

        // Usar transação para criar tudo junto
        const result = await prisma.$transaction(async (prisma) => {
            // 1. Criar usuário primeiro
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    whatsapp,
                    invite,
                    walletAddress // Já salva o endereço no usuário
                }
            });

            // 2. Marcar convite como usado
            await prisma.invite.update({
                where: { id: inviteRecord.id },
                data: { used: true }
            });

            // 3. Criar carteira depois que usuário existe
            const wallet = await prisma.wallet.create({
                data: {
                    address: walletAddress,
                    privateKey,
                    userId: user.id,
                    balance: 0
                }
            });

            return { user, wallet };
        });

        const token = jwt.sign(
            { userId: result.user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            user: {
                id: result.user.id,
                email: result.user.email,
                whatsapp: result.user.whatsapp,
                walletAddress: result.wallet.address
            },
            token
        };
    },

    async login(email, password) {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new Error('Senha inválida');
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            user: {
                id: user.id,
                email: user.email,
                whatsapp: user.whatsapp
            },
            token
        };
    },

    async completeRegistration(userId, userData) {
        const { name, birthDate, address, cpf } = userData;

        // Verificar se CPF já existe
        const existingCPF = await prisma.user.findUnique({
            where: { cpf }
        });

        if (existingCPF) {
            throw new Error('CPF já cadastrado');
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                birthDate: new Date(birthDate),
                address,
                cpf
            }
        });

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            whatsapp: user.whatsapp,
            address: user.address,
            cpf: user.cpf
        };
    },

    async findUserById(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        return user;
    }
};

module.exports = authService; 
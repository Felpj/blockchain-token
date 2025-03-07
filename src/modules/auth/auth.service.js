const prisma = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authService = {
    async register(userData) {
        const { email, password, whatsapp, invite } = userData;

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw new Error('Email já cadastrado');
        }

        const inviteRecord = await prisma.invite.findFirst({
            where: { 
                code: invite,
                used: false
            }
        });

        if (!inviteRecord) {
            throw new Error('Convite inválido ou já utilizado');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                whatsapp,
                invite
            }
        });

        await prisma.invite.update({
            where: { id: inviteRecord.id },
            data: { used: true }
        });

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
    }
};

module.exports = authService; 
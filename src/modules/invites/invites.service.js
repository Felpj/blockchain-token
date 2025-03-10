const prisma = require('../../config/database');
const crypto = require('crypto');

const invitesService = {
    async generateInvite() {
        // Gera um código de 8 caracteres
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();

        const invite = await prisma.invite.create({
            data: {
                code,
                used: false
            }
        });

        return invite;
    },

    async validateInvite(code) {
        const invite = await prisma.invite.findFirst({
            where: {
                code,
                used: false
            }
        });

        if (!invite) {
            throw new Error('Convite inválido ou já utilizado');
        }

        return invite;
    }
};

module.exports = invitesService; 
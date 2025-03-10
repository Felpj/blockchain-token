const invitesService = require('./invites.service');

const invitesController = {
    async generateInvite(req, res) {
        try {
            const invite = await invitesService.generateInvite();
            return res.json(invite);
        } catch (error) {
            console.error('Erro ao gerar convite:', error);
            return res.status(400).json({ error: error.message });
        }
    }
};

module.exports = invitesController; 
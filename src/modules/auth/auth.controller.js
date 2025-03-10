const authService = require('./auth.service');

const authController = {
    async register(req, res) {
        try {
            const { email, password, whatsapp, invite } = req.body;

            if (!email || !password || !whatsapp || !invite) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            }

            const user = await authService.register(req.body);
            return res.status(201).json(user);
        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
            return res.status(400).json({ error: error.message });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email e senha são obrigatórios' });
            }

            const result = await authService.login(email, password);
            return res.json(result);
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            return res.status(401).json({ error: error.message });
        }
    },

    async completeRegistration(req, res) {
        try {
            const { name, birthDate, address, cpf } = req.body;

            if (!name || !birthDate || !address || !cpf) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            }

            const user = await authService.completeRegistration(req.user.id, {
                name,
                birthDate,
                address,
                cpf
            });

            return res.json(user);
        } catch (error) {
            console.error('Erro ao completar cadastro:', error);
            return res.status(400).json({ error: error.message });
        }
    }
};

module.exports = authController; 
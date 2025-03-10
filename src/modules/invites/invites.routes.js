const express = require('express');
const invitesController = require('./invites.controller');

const router = express.Router();

// Rota protegida - apenas usuários autenticados podem gerar convites
router.get('/generate', invitesController.generateInvite);

module.exports = router; 
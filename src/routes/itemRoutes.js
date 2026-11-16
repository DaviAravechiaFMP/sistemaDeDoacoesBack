const express = require('express');
const router = express.Router();
const itemController = '../controllers/itemController';
const autenticar = require('../middlewares/autenticar.js'); 

router.get('/', autenticar, itemController.listar);

module.exports = router;

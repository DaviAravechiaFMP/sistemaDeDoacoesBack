const express = require("express");
const campanhaController = require("../controllers/campanhaController");
const autenticar = require("../middlewares/autenticar");

const router = express.Router();

router.get("/", autenticar, campanhaController.listar);

module.exports = router;

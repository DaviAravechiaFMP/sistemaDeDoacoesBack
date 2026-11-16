const express = require("express");
const authController = require("../controllers/authController");
const validar = require("../middlewares/validar");
const { registroSchema, loginSchema } = require("../schemas");

const router = express.Router();

router.post("/registrar", validar(registroSchema), authController.registrar);
router.post("/login", validar(loginSchema), authController.login);

module.exports = router;

const express = require("express");
const doacaoController = require("../controllers/doacaoController");
const autenticar = require("../middlewares/autenticar");
const validar = require("../middlewares/validar");
const { doacaoSchema, doacaoUpdateSchema } = require("../schemas");

const router = express.Router();

router.get("/", autenticar, doacaoController.listar);
router.get("/:id", autenticar, doacaoController.buscarPorId);
router.post("/", autenticar, validar(doacaoSchema), doacaoController.criar);
router.put("/:id", autenticar, validar(doacaoUpdateSchema), doacaoController.atualizar);
router.delete("/:id", autenticar, doacaoController.excluir);

module.exports = router;

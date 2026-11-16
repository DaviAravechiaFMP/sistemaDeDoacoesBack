const pool = require('../config/db.js'); 

const itemModel = {
  async listarTodos() {
    const query = 'SELECT id, nome, categoria FROM itens ORDER BY id ASC';
    const resultado = await pool.query(query);
    return resultado.rows;
  }
};

module.exports = itemModel;

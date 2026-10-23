const pool = require('../db/pool');

async function findAll() {
  const { rows } = await pool.query(
    'SELECT id, name, email, department, role FROM users ORDER BY id'
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, name, email, department, role FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

module.exports = { findAll, findById };
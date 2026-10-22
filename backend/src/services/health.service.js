const pool = require('../db/pool');

async function check() {
  const result = await pool.query('SELECT NOW() AS time');
  return {
    status: 'ok',
    database: 'connected',
    time: result.rows[0].time,
  };
}

module.exports = { check };
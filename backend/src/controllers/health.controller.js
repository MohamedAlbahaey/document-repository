const healthService = require('../services/health.service');

async function check(req, res) {
  try {
    const result = await healthService.check();
    res.json(result);
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
}

module.exports = { check };
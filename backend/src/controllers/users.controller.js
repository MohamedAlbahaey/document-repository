const usersService = require('../services/users.service');

async function list(req, res, next) {
  try {
    res.json(await usersService.list());
  } catch (err) {
    next(err);
  }
}

function me(req, res) {
  res.json(req.user);
}

module.exports = { list, me };
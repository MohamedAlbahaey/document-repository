const usersService = require('../services/users.service');

async function currentUser(req, res, next) {
  try {
    const id = Number(req.header('x-user-id'));

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(401).json({ error: 'Missing or invalid x-user-id header' });
    }

    const user = await usersService.getById(id);
    if (!user) {
      return res.status(401).json({ error: 'Unknown user' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = currentUser;
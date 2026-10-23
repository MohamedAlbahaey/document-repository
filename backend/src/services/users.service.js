const usersRepository = require('../repositories/users.repository');

function list() {
  return usersRepository.findAll();
}

function getById(id) {
  return usersRepository.findById(id);
}

module.exports = { list, getById };
const express = require('express');
const usersController = require('../controllers/users.controller');
const currentUser = require('../middleware/currentUser');

const router = express.Router();

router.get('/', usersController.list);               // public: fills the dropdown
router.get('/me', currentUser, usersController.me); // needs the header

module.exports = router;
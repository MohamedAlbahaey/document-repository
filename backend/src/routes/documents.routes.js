const express = require('express');
const documentsController = require('../controllers/documents.controller');
const currentUser = require('../middleware/currentUser');
const upload = require('../middleware/upload');

const router = express.Router();

// Order matters: identify the user first, then accept the file
router.post('/', currentUser, upload.single('file'), documentsController.create);
router.get('/', currentUser, documentsController.search);
router.get('/:id', currentUser, documentsController.getById);
router.get('/:id/versions', currentUser, documentsController.getVersions);
router.get('/:id/download', currentUser, documentsController.download);

module.exports = router;
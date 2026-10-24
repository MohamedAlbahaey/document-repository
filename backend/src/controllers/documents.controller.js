const fs = require('fs/promises');
const documentsService = require('../services/documents.service');
const { validateUpload } = require('../validators/documents.validator');

async function create(req, res, next) {
  try {
    const data = validateUpload(req.body, req.file);
    const document = await documentsService.create({
      user: req.user,
      data,
      file: req.file,
    });
    res.status(201).json(document);
  } catch (err) {
    // The file is already on disk, so remove it if anything failed
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(err);
  }
}

module.exports = { create };
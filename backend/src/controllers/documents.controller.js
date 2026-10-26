const fs = require('fs/promises');
const AppError = require('../utils/AppError');
const documentsService = require('../services/documents.service');
const {
  validateUpload,
  validateSearch,
  parseId,
  parseVersion,
} = require('../validators/documents.validator');

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

async function search(req, res, next) {
  try {
    const filters = validateSearch(req.query);
    const result = await documentsService.search({ user: req.user, filters });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    res.json(await documentsService.getById({ user: req.user, id }));
  } catch (err) {
    next(err);
  }
}

async function getVersions(req, res, next) {
  try {
    const id = parseId(req.params.id);
    res.json(await documentsService.getVersions({ user: req.user, id }));
  } catch (err) {
    next(err);
  }
}

async function download(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const versionNumber = parseVersion(req.query.version);
    const file = await documentsService.getDownload({ user: req.user, id, versionNumber });

    // Sends the file and sets the download name to the ORIGINAL file name
    res.download(file.filePath, file.fileName, (err) => {
      if (err && !res.headersSent) {
        next(new AppError(404, 'File is missing on the server'));
      }
    });
  } catch (err) {
    next(err);
  }
}

async function addVersion(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!req.file) {
      throw new AppError(400, 'File is required (form field "file")');
    }

    const version = await documentsService.addVersion({
      user: req.user,
      id,
      file: req.file,
    });
    res.status(201).json(version);
  } catch (err) {
    // Multer already saved the file, so remove it if anything failed
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(err);
  }
}

module.exports = { create, search, getById, getVersions, download, addVersion };
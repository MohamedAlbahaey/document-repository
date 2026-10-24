const multer = require('multer');
const AppError = require('../utils/AppError');

function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// Express recognises an error handler by its 4 parameters
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File is too large (max 10 MB)' });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
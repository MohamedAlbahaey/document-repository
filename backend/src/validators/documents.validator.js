const AppError = require('../utils/AppError');

const MAX_TITLE_LENGTH = 255;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;
const MAX_DEPARTMENT_LENGTH = 50;

// "Finance, Legal ,finance" -> ["finance", "legal"]
function parseTags(raw) {
  if (!raw) return [];
  const tags = String(raw)
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(tags)];
}

function validateUpload(body, file) {
  if (!file) {
    throw new AppError(400, 'File is required (form field "file")');
  }

  const title = String(body.title || '').trim();
  if (!title) {
    throw new AppError(400, 'Title is required');
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new AppError(400, `Title must be at most ${MAX_TITLE_LENGTH} characters`);
  }

  const tags = parseTags(body.tags);
  if (tags.length > MAX_TAGS) {
    throw new AppError(400, `A document can have at most ${MAX_TAGS} tags`);
  }
  if (tags.some((t) => t.length > MAX_TAG_LENGTH)) {
    throw new AppError(400, `Each tag must be at most ${MAX_TAG_LENGTH} characters`);
  }

  const department = String(body.allowedDepartment || '').trim();
  if (department.length > MAX_DEPARTMENT_LENGTH) {
    throw new AppError(400, 'Department name is too long');
  }

  return { title, tags, allowedDepartment: department || null };
}

module.exports = { validateUpload };
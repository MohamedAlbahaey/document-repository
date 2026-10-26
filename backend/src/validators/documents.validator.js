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

function validateSearch(query) {
  const title = String(query.title || '').trim();
  const tag = String(query.tag || '').trim().toLowerCase();
  const uploader = String(query.uploader || '').trim();

  const filters = { title, tag, uploader };
  for (const [name, value] of Object.entries(filters)) {
    if (value.length > 100) {
      throw new AppError(400, `The ${name} filter is too long`);
    }
  }

  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError(400, 'page must be a positive integer');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError(400, 'limit must be between 1 and 100');
  }

  return { title, tag, uploader, page, limit };
}

const MAX_INT = 2147483647; // the largest value a Postgres INT can hold

function parseId(value, name = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0 || id > MAX_INT) {
    throw new AppError(400, `${name} must be a positive integer`);
  }
  return id;
}

function parseVersion(value) {
  if (value === undefined) return null; // no version means "the latest"
  return parseId(value, 'version');
}

module.exports = { validateUpload, validateSearch, parseId, parseVersion };
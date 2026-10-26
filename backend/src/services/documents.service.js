const path = require('path');
const pool = require('../db/pool');
const { withTransaction } = require('../db/transaction');
const { UPLOAD_DIR } = require('../config');
const AppError = require('../utils/AppError');
const documentsRepository = require('../repositories/documents.repository');
const tagsRepository = require('../repositories/tags.repository');

async function create({ user, data, file }) {
  return withTransaction(async (client) => {
    const doc = await documentsRepository.insertDocument(client, {
      title: data.title,
      uploaderId: user.id,
      allowedDepartment: data.allowedDepartment,
    });

    const version = await documentsRepository.insertVersion(client, {
      documentId: doc.id,
      versionNumber: 1,
      fileName: file.originalname,
      storedPath: file.filename, // the random name on disk
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedBy: user.id,
    });

    const tags = [];
    for (const name of data.tags) {
      const tag = await tagsRepository.findOrCreate(client, name);
      await documentsRepository.linkTag(client, doc.id, tag.id);
      tags.push(tag.name);
    }

    return {
      id: doc.id,
      title: doc.title,
      uploaderId: doc.uploader_id,
      allowedDepartment: doc.allowed_department,
      createdAt: doc.created_at,
      tags,
      currentVersion: {
        versionNumber: version.version_number,
        fileName: version.file_name,
        mimeType: version.mime_type,
        sizeBytes: Number(version.size_bytes),
      },
    };
  });
}

async function search({ user, filters }) {
  const rows = await documentsRepository.search(pool, {
    user,
    title: filters.title,
    tag: filters.tag,
    uploader: filters.uploader,
    limit: filters.limit,
    offset: (filters.page - 1) * filters.limit,
  });

  const results = rows.map((row) => ({
    id: row.id,
    title: row.title,
    tags: row.tags,
    allowedDepartment: row.allowed_department,
    createdAt: row.created_at,
    uploader: { id: row.uploader_id, name: row.uploader_name },
    currentVersion: {
      versionNumber: row.version_number,
      fileName: row.file_name,
      mimeType: row.mime_type,
      sizeBytes: Number(row.size_bytes),
    },
  }));

  return { page: filters.page, limit: filters.limit, results };
}

// The same rule as the SQL in search(): admin, or public, or same department
function canAccess(user, doc) {
  return (
    user.role === 'admin' ||
    doc.allowed_department === null ||
    doc.allowed_department.toLowerCase() === user.department.toLowerCase()
  );
}

async function getAccessibleDocument(user, id) {
  const doc = await documentsRepository.findById(pool, id);
  if (!doc) {
    throw new AppError(404, 'Document not found');
  }
  if (!canAccess(user, doc)) {
    throw new AppError(403, 'You do not have access to this document');
  }
  return doc;
}

function mapVersion(v) {
  return {
    versionNumber: v.version_number,
    fileName: v.file_name,
    mimeType: v.mime_type,
    sizeBytes: Number(v.size_bytes),
    createdAt: v.created_at,
    uploadedBy: { id: v.uploaded_by_id, name: v.uploaded_by_name },
  };
}

async function getById({ user, id }) {
  const doc = await getAccessibleDocument(user, id);
  const versions = (await documentsRepository.findVersions(pool, id)).map(mapVersion);

  return {
    id: doc.id,
    title: doc.title,
    tags: doc.tags,
    allowedDepartment: doc.allowed_department,
    createdAt: doc.created_at,
    uploader: { id: doc.uploader_id, name: doc.uploader_name },
    currentVersion: versions[0], // the list is newest first
    versions,
  };
}

async function getVersions({ user, id }) {
  await getAccessibleDocument(user, id);
  const versions = await documentsRepository.findVersions(pool, id);
  return versions.map(mapVersion);
}

async function getDownload({ user, id, versionNumber }) {
  await getAccessibleDocument(user, id);

  const version = await documentsRepository.findVersion(pool, id, versionNumber);
  if (!version) {
    throw new AppError(404, 'Version not found');
  }

  return {
    filePath: path.join(UPLOAD_DIR, version.stored_path),
    fileName: version.file_name,
  };
}

async function addVersion({ user, id, file }) {
  return withTransaction(async (client) => {
    const doc = await documentsRepository.lockById(client, id);
    if (!doc) {
      throw new AppError(404, 'Document not found');
    }
    if (!canAccess(user, doc)) {
      throw new AppError(403, 'You do not have access to this document');
    }

    const versionNumber = await documentsRepository.nextVersionNumber(client, id);

    const version = await documentsRepository.insertVersion(client, {
      documentId: id,
      versionNumber,
      fileName: file.originalname,
      storedPath: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedBy: user.id,
    });

    return {
      documentId: id,
      versionNumber: version.version_number,
      fileName: version.file_name,
      mimeType: version.mime_type,
      sizeBytes: Number(version.size_bytes),
      createdAt: version.created_at,
      uploadedBy: { id: user.id, name: user.name },
    };
  });
}

module.exports = { create, search, getById, getVersions, getDownload, addVersion };
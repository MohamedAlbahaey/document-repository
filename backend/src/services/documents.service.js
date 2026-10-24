const { withTransaction } = require('../db/transaction');
const documentsRepository = require('../repositories/documents.repository');
const tagsRepository = require('../repositories/tags.repository');
const pool = require('../db/pool');

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

module.exports = { create, search };
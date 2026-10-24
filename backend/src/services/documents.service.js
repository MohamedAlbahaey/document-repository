const { withTransaction } = require('../db/transaction');
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

module.exports = { create };
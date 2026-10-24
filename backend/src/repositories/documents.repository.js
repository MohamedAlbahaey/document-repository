async function insertDocument(db, { title, uploaderId, allowedDepartment }) {
  const { rows } = await db.query(
    `INSERT INTO documents (title, uploader_id, allowed_department)
     VALUES ($1, $2, $3)
     RETURNING id, title, uploader_id, allowed_department, created_at`,
    [title, uploaderId, allowedDepartment]
  );
  return rows[0];
}

async function insertVersion(
  db,
  { documentId, versionNumber, fileName, storedPath, mimeType, sizeBytes, uploadedBy }
) {
  const { rows } = await db.query(
    `INSERT INTO document_versions
       (document_id, version_number, file_name, stored_path, mime_type, size_bytes, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, version_number, file_name, mime_type, size_bytes, created_at`,
    [documentId, versionNumber, fileName, storedPath, mimeType, sizeBytes, uploadedBy]
  );
  return rows[0];
}

async function linkTag(db, documentId, tagId) {
  await db.query(
    `INSERT INTO document_tags (document_id, tag_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [documentId, tagId]
  );
}

module.exports = { insertDocument, insertVersion, linkTag };
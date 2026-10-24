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

// Makes % and _ in user input match literally instead of acting as wildcards
function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

async function search(db, { user, title, tag, uploader, limit, offset }) {
  const conditions = [];
  const params = [];
  // Stores a value and returns its placeholder: $1, $2, ...
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  // Permissions: admins see everything
  if (user.role !== 'admin') {
    conditions.push(
      `(d.allowed_department IS NULL
        OR LOWER(d.allowed_department) = LOWER(${add(user.department)}))`
    );
  }

  if (title) {
    conditions.push(`d.title ILIKE ${add(`%${escapeLike(title)}%`)}`);
  }
  if (uploader) {
    conditions.push(`u.name ILIKE ${add(`%${escapeLike(uploader)}%`)}`);
  }
  if (tag) {
    conditions.push(
      `EXISTS (
         SELECT 1 FROM document_tags dt
         JOIN tags t ON t.id = dt.tag_id
         WHERE dt.document_id = d.id AND t.name = ${add(tag)}
       )`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitPlaceholder = add(limit);
  const offsetPlaceholder = add(offset);

  const { rows } = await db.query(
    `SELECT d.id, d.title, d.allowed_department, d.created_at,
            u.id AS uploader_id, u.name AS uploader_name,
            v.version_number, v.file_name, v.mime_type, v.size_bytes,
            COALESCE(
              (SELECT array_agg(t.name ORDER BY t.name)
               FROM document_tags dt
               JOIN tags t ON t.id = dt.tag_id
               WHERE dt.document_id = d.id),
              ARRAY[]::varchar[]
            ) AS tags
     FROM documents d
     JOIN users u ON u.id = d.uploader_id
     JOIN LATERAL (
       SELECT version_number, file_name, mime_type, size_bytes
       FROM document_versions
       WHERE document_id = d.id
       ORDER BY version_number DESC
       LIMIT 1
     ) v ON TRUE
     ${where}
     ORDER BY d.created_at DESC, d.id DESC
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    params
  );
  return rows;
}

module.exports = { insertDocument, insertVersion, linkTag, search };
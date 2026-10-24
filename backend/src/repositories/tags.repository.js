// Returns the tag with this name, creating it first if it doesn't exist
async function findOrCreate(db, name) {
  const { rows } = await db.query(
    `INSERT INTO tags (name)
     VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name`,
    [name]
  );
  return rows[0];
}

module.exports = { findOrCreate };
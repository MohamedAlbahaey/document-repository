-- Document Repository schema

CREATE TABLE users (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    department  VARCHAR(50)  NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'employee'
                CHECK (role IN ('admin', 'employee'))
);

CREATE TABLE documents (
    id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    uploader_id         INT NOT NULL REFERENCES users(id),
    allowed_department  VARCHAR(50),            -- NULL means visible to everyone
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE document_versions (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_id     INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number  INT NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    stored_path     VARCHAR(500) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    size_bytes      BIGINT NOT NULL,
    uploaded_by     INT NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, version_number)
);

CREATE TABLE tags (
    id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE document_tags (
    document_id  INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id       INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);

-- Indexes for the columns we search and join by
CREATE INDEX idx_documents_title       ON documents (title);
CREATE INDEX idx_documents_uploader    ON documents (uploader_id);
CREATE INDEX idx_document_tags_tag     ON document_tags (tag_id);
CREATE INDEX idx_versions_document     ON document_versions (document_id);
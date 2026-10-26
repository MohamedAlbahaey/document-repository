'use client';

import { useState } from 'react';
import Link from 'next/link';
import { request } from '@/lib/api';
import { useUser } from '@/components/UserProvider';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB, same limit as the API
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.txt', '.png', '.jpg', '.jpeg'];

const inputClass =
  'mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

// If the API still rejects something, show its message under the matching field
function fieldForServerError(message) {
  const m = message.toLowerCase();
  if (m.includes('title')) return 'title';
  if (m.includes('tag')) return 'tags';
  if (m.includes('file')) return 'file';
  return 'form';
}

export default function UploadPage() {
  const { users, currentUser } = useUser();

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [department, setDepartment] = useState('');
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0); // changing the key empties the file input
  const [errors, setErrors] = useState({});
  const [created, setCreated] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // The department list is built from the users we already loaded
  const departments = [...new Set(users.map((u) => u.department))].sort();

  function clearError(name) {
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate() {
    const found = {};

    if (!title.trim()) {
      found.title = 'Title is required';
    }

    const tagList = [...new Set(tags.split(',').map((t) => t.trim()).filter(Boolean))];
    if (tagList.length > 10) {
      found.tags = 'A document can have at most 10 tags';
    } else if (tagList.some((t) => t.length > 50)) {
      found.tags = 'Each tag must be at most 50 characters';
    }

    if (!file) {
      found.file = 'Please choose a file';
    } else {
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        found.file = 'File type not allowed. Allowed: PDF, DOCX, XLSX, TXT, PNG, JPG';
      } else if (file.size > MAX_FILE_SIZE) {
        found.file = 'File is too large (max 10 MB)';
      }
    }

    return found;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setCreated(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('tags', tags);
      formData.append('allowedDepartment', department);
      formData.append('file', file);

      // No Content-Type header here: the browser sets it, including the multipart boundary
      const res = await request('/api/documents', {
        method: 'POST',
        body: formData,
        userId: currentUser.id,
      });

      setCreated(await res.json());
      setTitle('');
      setTags('');
      setDepartment('');
      setFile(null);
      setFileInputKey((k) => k + 1);
    } catch (err) {
      setErrors({ [fieldForServerError(err.message)]: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Upload a document</h1>
      <p className="mt-1 text-sm text-gray-600">
        {currentUser ? (
          <>
            Uploading as <strong>{currentUser.name}</strong> ({currentUser.department})
          </>
        ) : (
          'Loading user...'
        )}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearError('title');
            }}
            maxLength={255}
            className={inputClass}
          />
          <FieldError message={errors.title} />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => {
              setTags(e.target.value);
              clearError('tags');
            }}
            placeholder="finance, legal"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500">Separate tags with commas (max 10).</p>
          <FieldError message={errors.tags} />
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium">
            Who can see it?
          </label>
          <select
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={inputClass}
          >
            <option value="">Everyone</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d} only
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium">
            File *
          </label>
          <input
            key={fileInputKey}
            id="file"
            type="file"
            accept=".pdf,.docx,.xlsx,.txt,.png,.jpg,.jpeg"
            onChange={(e) => {
              setFile(e.target.files[0] || null);
              clearError('file');
            }}
            className="mt-1 block w-full text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">PDF, DOCX, XLSX, TXT, PNG or JPG, up to 10 MB.</p>
          <FieldError message={errors.file} />
        </div>

        <div>
          <button
            type="submit"
            disabled={submitting || !currentUser}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Uploading...' : 'Upload'}
          </button>
          <FieldError message={errors.form} />
        </div>
      </form>

      {created && (
        <div className="mt-4 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Uploaded <strong>{created.title}</strong> (version {created.currentVersion.versionNumber}).{' '}
          <Link href={`/documents/${created.id}`} className="font-medium underline">
            View document
          </Link>
        </div>
      )}
    </div>
  );
}
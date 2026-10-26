'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getJson, request } from '@/lib/api';
import { useUser } from '@/components/UserProvider';
import { formatDate, formatSize } from '@/lib/format';
import { ACCEPT, validateFile } from '@/lib/files';

export default function DocumentPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
      <DocumentRoute />
    </Suspense>
  ); 
}

function DocumentRoute() {
  const { id } = useParams();
  const { currentUser } = useUser();

  // The key resets the page when another user is chosen, so access is checked again for them
  return (
    <DocumentView
      key={`${id}-${currentUser?.id ?? 'none'}`}
      id={id}
      userId={currentUser?.id}
    />
  );
}

function DocumentView({ id, userId }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0); // increase it to fetch the document again

  const [downloading, setDownloading] = useState(null); // the version being downloaded
  const [downloadError, setDownloadError] = useState('');

  const [newFile, setNewFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0); // changing the key empties the file input
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await getJson(`/api/documents/${id}`, userId);
        if (!cancelled) {
          setDoc(data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, userId, reloadKey]);

  async function handleDownload(versionNumber, fileName) {
    setDownloadError('');
    setDownloading(versionNumber);
    try {
      const res = await request(`/api/documents/${id}/download?version=${versionNumber}`, {
        userId,
      });
      const blob = await res.blob();

      // Turn the blob into a temporary link and click it to start the browser's download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloading(null);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    setUploadMessage('');

    const problem = validateFile(newFile);
    setUploadError(problem);
    if (problem) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', newFile);

      const res = await request(`/api/documents/${id}/versions`, {
        method: 'POST',
        body: formData,
        userId,
      });
      const version = await res.json();

      setUploadMessage(`Version ${version.versionNumber} uploaded.`);
      setNewFile(null);
      setFileInputKey((k) => k + 1);
      setReloadKey((k) => k + 1); // refresh the table
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  if (!doc) {
    return (
      <div>
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/search" className="mt-2 inline-block text-sm text-blue-700 hover:underline">
          Back to search
        </Link>
      </div>
    );
  }

  const current = doc.currentVersion;

  return (
    <div>
      <Link href="/search" className="text-sm text-blue-700 hover:underline">
        &larr; Back to search
      </Link>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">{doc.title}</h1>
        {doc.allowedDepartment && (
          <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            {doc.allowedDepartment} only
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Uploaded by</dt>
            <dd className="font-medium">{doc.uploader.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Created</dt>
            <dd className="font-medium">{formatDate(doc.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Visible to</dt>
            <dd className="font-medium">
              {doc.allowedDepartment ? `${doc.allowedDepartment} only` : 'Everyone'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Tags</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {doc.tags.length === 0 && <span className="text-gray-400">No tags</span>}
              {doc.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {tag}
                </span>
              ))}
            </dd>
          </div>
        </dl>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600">
            Current version: <strong>v{current.versionNumber}</strong> &middot; {current.fileName} (
            {formatSize(current.sizeBytes)})
          </p>
          <button
            type="button"
            onClick={() => handleDownload(current.versionNumber, current.fileName)}
            disabled={downloading !== null}
            className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {downloading === current.versionNumber ? 'Downloading...' : 'Download latest version'}
          </button>
        </div>
      </div>

      {/* Version history */}
      <h2 className="mt-8 text-lg font-semibold">Version history</h2>
      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-2">Version</th>
              <th className="px-4 py-2">File</th>
              <th className="px-4 py-2">Size</th>
              <th className="px-4 py-2">Uploaded by</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {doc.versions.map((v) => (
              <tr key={v.versionNumber} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2">
                  v{v.versionNumber}
                  {v.versionNumber === current.versionNumber && (
                    <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                      current
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">{v.fileName}</td>
                <td className="px-4 py-2">{formatSize(v.sizeBytes)}</td>
                <td className="px-4 py-2">{v.uploadedBy.name}</td>
                <td className="px-4 py-2">{formatDate(v.createdAt)}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleDownload(v.versionNumber, v.fileName)}
                    disabled={downloading !== null}
                    className="text-blue-700 hover:underline disabled:opacity-50"
                  >
                    {downloading === v.versionNumber ? 'Downloading...' : 'Download'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {downloadError && <p className="mt-2 text-sm text-red-600">{downloadError}</p>}

      {/* Upload a new version */}
      <h2 className="mt-8 text-lg font-semibold">Upload a new version</h2>
      <form
        onSubmit={handleUpload}
        className="mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <input
          key={fileInputKey}
          type="file"
          accept={ACCEPT}
          onChange={(e) => {
            setNewFile(e.target.files[0] || null);
            setUploadError('');
            setUploadMessage('');
          }}
          className="block w-full text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">PDF, DOCX, XLSX, TXT, PNG or JPG, up to 10 MB.</p>
        {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
        {uploadMessage && <p className="mt-1 text-sm text-green-700">{uploadMessage}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload new version'}
        </button>
      </form>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getJson } from '@/lib/api';
import { useUser } from '@/components/UserProvider';
import { formatDate, formatSize } from '@/lib/format';

const PAGE_SIZE = 10;
const EMPTY_FILTERS = { title: '', tag: '', uploader: '' };

const inputClass =
  'mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';

export default function SearchPage() {
  const { currentUser } = useUser();
  // The key makes React throw away the page state when another user is chosen,
  // so the filters and the page number start fresh for the new user.
  return <SearchView key={currentUser?.id ?? 'none'} userId={currentUser?.id} />;
}

function SearchView({ userId }) {
  const [form, setForm] = useState(EMPTY_FILTERS); // what is typed in the inputs
  const [filters, setFilters] = useState(EMPTY_FILTERS); // what was actually searched
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (filters.title) params.set('title', filters.title);
        if (filters.tag) params.set('tag', filters.tag);
        if (filters.uploader) params.set('uploader', filters.uploader);

        const data = await getJson(`/api/documents?${params}`, userId);
        if (!cancelled) setResults(data.results);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true; // ignore a slow response that arrives after a newer request
    };
  }, [filters, page, userId]);

  function handleSubmit(e) {
    e.preventDefault();
    setPage(1);
    setFilters({
      title: form.title.trim(),
      tag: form.tag.trim().toLowerCase(),
      uploader: form.uploader.trim(),
    });
  }

  function handleClear() {
    setForm(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function searchByTag(tag) {
    setForm({ ...EMPTY_FILTERS, tag });
    setFilters({ ...EMPTY_FILTERS, tag });
    setPage(1);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Search documents</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="title" className="block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tag" className="block text-sm font-medium">
              Tag
            </label>
            <input
              id="tag"
              type="text"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="uploader" className="block text-sm font-medium">
              Uploader
            </label>
            <input
              id="uploader"
              type="text"
              value={form.uploader}
              onChange={(e) => setForm({ ...form, uploader: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-gray-500">Loading...</p>}

        {!loading && !error && results.length === 0 && (
          <p className="text-sm text-gray-500">No documents found.</p>
        )}

        {results.map((doc) => (
          <div key={doc.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <Link
                href={`/documents/${doc.id}`}
                className="font-semibold text-blue-700 hover:underline"
              >
                {doc.title}
              </Link>
              {doc.allowedDepartment && (
                <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  {doc.allowedDepartment} only
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-gray-600">
              {doc.uploader.name} · {formatDate(doc.createdAt)} · version{' '}
              {doc.currentVersion.versionNumber} · {doc.currentVersion.fileName} (
              {formatSize(doc.currentVersion.sizeBytes)})
            </p>

            {doc.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {doc.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => searchByTag(tag)}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-blue-100"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 1 || loading}
          className="rounded border border-gray-300 bg-white px-3 py-1 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-500">Page {page}</span>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={results.length < PAGE_SIZE || loading}
          className="rounded border border-gray-300 bg-white px-3 py-1 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Document Repository</h1>
      <p className="mt-2 text-gray-600">Upload, store and search company documents.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/search"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-blue-400"
        >
          <h2 className="font-semibold">Search documents</h2>
          <p className="mt-1 text-sm text-gray-600">Find documents by title, tag or uploader.</p>
        </Link>

        <Link
          href="/upload"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-blue-400"
        >
          <h2 className="font-semibold">Upload a document</h2>
          <p className="mt-1 text-sm text-gray-600">Add a new document with a title and tags.</p>
        </Link>
      </div>
    </div>
  );
}
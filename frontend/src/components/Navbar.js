'use client';

import Link from 'next/link';
import { useUser } from '@/components/UserProvider';

export default function Navbar() {
  const { users, currentUser, selectUser, loading, error } = useUser();

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-blue-700">
            Document Repository
          </Link>
          <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900">
            Search
          </Link>
          <Link href="/upload" className="text-sm text-gray-600 hover:text-gray-900">
            Upload
          </Link>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="user-select" className="text-gray-500">
            Acting as
          </label>
          <select
            id="user-select"
            value={currentUser?.id ?? ''}
            onChange={(e) => selectUser(Number(e.target.value))}
            disabled={loading || users.length === 0}
            className="rounded border border-gray-300 bg-white px-2 py-1"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.department}, {u.role})
              </option>
            ))}
          </select>
        </div>
      </nav>

      {error && (
        <p className="border-t border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}
    </header>
  );
}
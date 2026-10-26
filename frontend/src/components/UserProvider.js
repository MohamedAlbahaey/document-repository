'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { fetchUsers } from '@/lib/api';

const UserContext = createContext(null);
const STORAGE_KEY = 'docrepo-user-id';

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const list = await fetchUsers();
        setUsers(list);

        // Restore the last chosen user, or fall back to the first one
        const saved = Number(localStorage.getItem(STORAGE_KEY));
        const match = list.find((u) => u.id === saved);
        setCurrentUserId(match ? match.id : list[0]?.id ?? null);
      } catch {
        setError('Cannot reach the API. Is the backend running on port 4000?');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function selectUser(id) {
    setCurrentUserId(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  return (
    <UserContext.Provider value={{ users, currentUser, selectUser, loading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used inside <UserProvider>');
  }
  return context;
}
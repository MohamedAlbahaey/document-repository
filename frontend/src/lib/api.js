export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Sends a request to the API. If a userId is given, it is sent as the x-user-id header.
export async function request(path, { userId, ...options } = {}) {
  const headers = { ...(options.headers || {}) };
  if (userId) {
    headers['x-user-id'] = String(userId);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
    } catch {
      // the response had no JSON body, keep the default message
    }
    throw new ApiError(res.status, message);
  }

  return res;
}

export async function getJson(path, userId) {
  const res = await request(path, { userId });
  return res.json();
}

export function fetchUsers() {
  return getJson('/api/users');
}
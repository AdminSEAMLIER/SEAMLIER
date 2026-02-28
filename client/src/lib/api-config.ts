export const API_ENDPOINTS = {
  auth: {
    login: `/api/login`,
    register: `/api/register`,
    user: `/api/auth/user`,
    logout: `/api/logout`,
  },
  tailors: `/api/tailors`,
  admin: {
    users: `/api/admin/users`,
    artisans: `/api/admin/artisans`,
    artisan: (id: number | string) => `/api/admin/artisans/${id}`,
    settings: `/api/admin/settings`,
    stats: `/api/admin/stats`,
  },
};

export async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const body = await res.json();
      errorMessage = body.message || body.error || JSON.stringify(body);
    } catch {
      const text = await res.text().catch(() => "");
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage || `Request failed: ${res.status}`);
  }
  return res;
}

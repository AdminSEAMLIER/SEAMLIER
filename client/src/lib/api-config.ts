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
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

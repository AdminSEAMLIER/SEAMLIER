const isProduction = import.meta.env.PROD;
const PHP_BASE = import.meta.env.VITE_PHP_BASE_URL || "";

export const API_ENDPOINTS = {
  auth: {
    register: isProduction ? `${PHP_BASE}/auth.php?action=register` : "/api/auth/register",
    login: isProduction ? `${PHP_BASE}/auth.php?action=login` : "/api/login",
    user: isProduction ? `${PHP_BASE}/auth.php?action=user` : "/api/auth/user",
    logout: isProduction ? `${PHP_BASE}/auth.php?action=logout` : "/api/logout",
  },
  admin: {
    artisans: isProduction ? `${PHP_BASE}/admin.php?action=artisans` : "/api/admin/artisans",
    artisan: (id: string) =>
      isProduction ? `${PHP_BASE}/admin.php?action=artisan&id=${id}` : `/api/admin/artisans/${id}`,
    settings: isProduction ? `${PHP_BASE}/admin.php?action=settings` : "/api/admin/settings",
  },
};

export function resolveApiUrl(path: string): string {
  if (!isProduction) return path;

  const clean = path.replace(/^\//, "");

  if (clean.startsWith("api/admin/artisans/")) {
    const id = clean.replace("api/admin/artisans/", "");
    return `${PHP_BASE}/admin.php?action=artisan&id=${id}`;
  }
  if (clean === "api/admin/artisans") return `${PHP_BASE}/admin.php?action=artisans`;
  if (clean === "api/admin/settings") return `${PHP_BASE}/admin.php?action=settings`;
  if (clean === "api/auth/user") return API_ENDPOINTS.auth.user;
  if (clean === "api/auth/register") return API_ENDPOINTS.auth.register;
  if (clean === "api/login") return API_ENDPOINTS.auth.login;
  if (clean === "api/logout") return API_ENDPOINTS.auth.logout;

  const slug = clean.replace(/^api\//, "");
  return `${PHP_BASE}/data.php?route=${encodeURIComponent(slug)}`;
}

export async function phpFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  return res;
}

export async function safeParse<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Le serveur a renvoyé une réponse inattendue. Vérifiez que le fichier PHP est accessible.`
    );
  }
}

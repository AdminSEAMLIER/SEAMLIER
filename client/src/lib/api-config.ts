/**
 * Configuration de l'API Seamlier — Express Node.js sur o2switch
 */

export const API_BASE_URL = "";  // Relatif — même domaine

export const API_ENDPOINTS = {
  auth: {
    login: `/api/login`,
    register: `/api/register`,
    user: `/api/auth/user`,
    logout: `/api/logout`,
  },
  tailors: `/api/tailors`,
};

/**
 * Utilitaire de résolution d'URL
 */
export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return path;
}

/**
 * Fetch standard avec credentials (pour les sessions)
 */
export async function phpFetch(url: string, options: RequestInit = {}) {
  const finalUrl = resolveApiUrl(url);
  return fetch(finalUrl, {
    ...options,
    credentials: "include", // Indispensable pour les sessions cookie
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/**
 * Analyse sécurisée du JSON
 */
export async function safeParse<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      console.error("Le serveur a renvoyé du HTML au lieu de JSON.");
      return null;
    }
    return JSON.parse(text) as T;
  } catch (e) {
    console.error("Erreur de lecture JSON:", e);
    return null;
  }
}
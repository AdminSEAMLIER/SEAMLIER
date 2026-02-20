import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { API_ENDPOINTS, phpFetch, safeParse } from "@/lib/api-config";

// Interface utilisateur correspondant à ton schéma backend
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImageUrl?: string;
}

/**
 * Récupère l'utilisateur actuellement connecté
 * Gère les cas 401 (non autorisé) et les erreurs de parsing
 */
async function fetchUser(): Promise<User | null> {
  try {
    const response = await phpFetch(API_ENDPOINTS.auth.user);

    // Si le serveur répond 401, l'utilisateur n'est pas connecté
    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    // safeParse gère les erreurs de JSON malformé (Point 1)
    const result = await safeParse<User>(response);
    return result;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
}

/**
 * Envoie une requête de déconnexion au serveur PHP
 */
async function logoutRequest(): Promise<void> {
  await phpFetch(API_ENDPOINTS.auth.logout, { method: "POST" });
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Query pour maintenir l'état de l'utilisateur
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["auth-user"],
    queryFn: fetchUser,
    retry: false, // Ne pas réessayer si 401
    staleTime: 1000 * 60 * 5, // Cache de 5 minutes
  });

  // Mutation pour la déconnexion
  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      // Nettoyer le cache et rediriger
      queryClient.setQueryData(["auth-user"], null);
      setLocation("/connexion");
    },
  });

  /**
   * Point 4: Helper pour rediriger l'utilisateur vers son dashboard
   * selon son rôle (tailor ou client)
   */
  const navigateToDashboard = (role?: string) => {
    const userRole = role || user?.role;
    if (userRole === "tailor") {
      setLocation("/professionnel/dashboard");
    } else {
      setLocation("/particulier/accueil");
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    // Méthode pratique à appeler après un login/register réussi
    navigateToDashboard,
  };
}
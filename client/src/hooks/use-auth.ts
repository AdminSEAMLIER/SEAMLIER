import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { API_ENDPOINTS, apiFetch } from "@/lib/api-config";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImageUrl?: string;
}

async function fetchUser(): Promise<User | null> {
  try {
    const response = await apiFetch(API_ENDPOINTS.auth.user);

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
}

async function logoutRequest(): Promise<void> {
  await apiFetch(API_ENDPOINTS.auth.logout, { method: "POST" });
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["auth-user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      queryClient.setQueryData(["auth-user"], null);
      setLocation("/connexion");
    },
  });

  const navigateToDashboard = (role?: string) => {
    const userRole = role || user?.role;
    if (userRole === "admin") {
      setLocation("/admin/dashboard");
    } else if (userRole === "tailor") {
      setLocation("/dashboard-pro");
    } else {
      setLocation("/dashboard-client");
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    navigateToDashboard,
  };
}

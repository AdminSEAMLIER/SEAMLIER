import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { API_ENDPOINTS, apiFetch } from "@/lib/api-config";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImageUrl?: string;
  phone?: string;
  location?: string;
}

const STORAGE_KEY = "seamlier_auth";

function getCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: User | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

async function fetchUser(): Promise<User | null> {
  try {
    const response = await apiFetch(API_ENDPOINTS.auth.user);
    if (!response.ok) {
      return getCachedUser();
    }
    const user = await response.json();
    setCachedUser(user);
    return user;
  } catch {
    return getCachedUser();
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
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: getCachedUser,
    initialDataUpdatedAt: Date.now,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      setCachedUser(null);
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

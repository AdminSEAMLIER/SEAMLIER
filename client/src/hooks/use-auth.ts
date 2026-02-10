import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { API_ENDPOINTS, phpFetch, safeParse } from "@/lib/api-config";

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
    const response = await phpFetch(API_ENDPOINTS.auth.user);

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return await safeParse<User>(response);
  } catch {
    return null;
  }
}

async function logoutRequest(): Promise<void> {
  await phpFetch(API_ENDPOINTS.auth.logout, { method: "POST" });
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery<User | null>({
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

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

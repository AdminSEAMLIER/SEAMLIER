export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function redirectToLogin(toast?: (options: { title: string; description: string; variant: string }) => void) {
  if (toast) {
    toast({
      title: "Session expirée",
      description: "Veuillez vous reconnecter",
      variant: "destructive",
    });
  }
  setTimeout(() => {
    window.location.href = "/connexion";
  }, 500);
}

export { setupAuth, isAuthenticated, getSession, requireTailor, requireClient } from "./localAuth";
export { authStorage, type IAuthStorage } from "./storage";
export { registerRoutes as registerAuthRoutes } from "./routes";

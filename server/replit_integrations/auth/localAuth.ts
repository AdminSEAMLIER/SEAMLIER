import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import type { Express, RequestHandler } from "express";
import mysqlSession from "express-mysql-session";
import { authStorage } from "./storage";
import { storage } from "../../storage";
import crypto from "crypto";
import { generateVerificationToken, getVerificationExpiry, sendVerificationEmail, sendPasswordResetEmail } from "../../email";

// ─── Session ────────────────────────────────────────────────────────────────

export function getSession() {
  const sessionTtl = 315360e6; // ~10 ans
  const MySQLStore = mysqlSession(session as any);

  const dbUrl = process.env.MYSQL_DATABASE_URL || process.env.DATABASE_URL || "";
  const url = new URL(dbUrl);
  const options = {
    host: url.hostname,
    port: parseInt(url.port || "3306"),
    user: url.username,
    password: url.password,
    database: url.pathname.replace("/", ""),
    createDatabaseTable: true,
    expiration: 315360e6,
    checkExpirationInterval: 9e5,
    schema: {
      tableName: "sessions",
      columnNames: {
        session_id: "session_id",
        expires: "expires",
        data: "data",
      },
    },
  };

  const sessionStore = new MySQLStore(options);

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: true,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

// ─── Setup Auth ──────────────────────────────────────────────────────────────

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(cookieParser());
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await authStorage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Email ou mot de passe incorrect." });
          }
          if (!user.password) {
            return done(null, false, { message: "Compte sans mot de passe configuré." });
          }
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) {
            return done(null, false, { message: "Email ou mot de passe incorrect." });
          }
          if (user.emailVerified === false && user.verificationToken) {
            return done(null, false, { message: "Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception." });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, cb) => cb(null, user.id));
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await authStorage.getUser(id);
      cb(null, user);
    } catch (err) {
      cb(err);
    }
  });

  // ── Routes Auth ────────────────────────────────────────────────────────────

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Identifiants invalides." });
      }
      req.session.regenerate((regenerateErr) => {
        if (regenerateErr) return next(regenerateErr);
        req.logIn(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          req.session.save(() => {
            return res.json({
              success: true,
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              profileImageUrl: user.profileImageUrl,
            });
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, fullName, role, phone,
              specialty, city, yearsExperience, bio, siret, companyName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis." });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Le mot de passe doit faire au moins 8 caractères." });
      }

      const existing = await authStorage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Un compte avec cet email existe déjà." });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const userRole = role === "tailor" ? "tailor" : "client";

      let resolvedFirstName = firstName || null;
      let resolvedLastName = lastName || null;
      if (!resolvedFirstName && fullName) {
        const parts = fullName.trim().split(/\s+/);
        resolvedFirstName = parts[0];
        resolvedLastName = parts.slice(1).join(" ") || "";
      }

      const verificationToken = generateVerificationToken();
      const verificationExpires = getVerificationExpiry();

      const newUser = await authStorage.createUser({
        email,
        password: hashedPassword,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        role: userRole,
        profileImageUrl: null,
        phone: phone || null,
        location: city || null,
        emailVerified: false,
        verificationToken,
        verificationExpires,
      } as any);

      if (userRole === "tailor") {
        try {
          await storage.createAdminArtisan({
            firstName: resolvedFirstName || "",
            lastName: resolvedLastName || "",
            email,
            phone: phone || "",
            specialty: specialty || "",
            city: city || "",
            status: "En attente",
            siret: siret || "",
            companyName: companyName || "",
            yearsExperience: parseInt(yearsExperience) || 0,
            bio: bio || "",
            subscriptionPlan: "Starter",
            paymentStatus: "En attente",
          });
        } catch (artisanError) {
          console.error("Error creating artisan profile:", artisanError);
        }
      }

      sendVerificationEmail(email, verificationToken, resolvedFirstName).catch(err => {
        console.error("Failed to send verification email:", err);
      });

      return res.status(201).json({
        success: true,
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        emailVerificationSent: true,
        message: "Compte créé ! Vérifiez votre email pour activer votre compte.",
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Non authentifié." });
    }
    const user = req.user as any;
    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      phone: user.phone || null,
      location: user.location || null,
    });
  });

  // ─── Changement de mot de passe (utilisateur connecté) ──────────────────────
  app.post("/api/auth/change-password", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Non authentifié." });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
    }
    try {
      const userId = (req.user as any).id;
      const user = await authStorage.getUserByEmail((req.user as any).email);
      if (!user?.password) return res.status(400).json({ message: "Compte sans mot de passe." });
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ message: "Mot de passe actuel incorrect." });
      const hashed = await bcrypt.hash(newPassword, 12);
      await storage.updateUser(userId, { password: hashed } as any);
      res.json({ success: true, message: "Mot de passe modifié avec succès." });
    } catch (error) {
      console.error("change-password error:", error);
      res.status(500).json({ message: "Erreur lors du changement de mot de passe." });
    }
  });

  // ─── Mot de passe oublié ─────────────────────────────────────────────────────
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis." });
    try {
      const user = await authStorage.getUserByEmail(email);
      // Always respond OK to not reveal if email exists
      if (!user) return res.json({ success: true, message: "Si ce compte existe, un email a été envoyé." });
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      await storage.updateUser(user.id, { resetToken: token, resetTokenExpires: expires } as any);
      sendPasswordResetEmail(email, token, user.firstName).catch(err => {
        console.error("Failed to send reset email:", err);
      });
      res.json({ success: true, message: "Si ce compte existe, un email a été envoyé." });
    } catch (error) {
      console.error("forgot-password error:", error);
      res.status(500).json({ message: "Erreur serveur." });
    }
  });

  // ─── Réinitialisation du mot de passe (via token) ────────────────────────────
  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Token et mot de passe requis." });
    if (newPassword.length < 8) return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
    try {
      const user = await storage.getUserByResetToken(token);
      if (!user) return res.status(400).json({ message: "Lien invalide ou expiré. Veuillez refaire une demande." });
      const hashed = await bcrypt.hash(newPassword, 12);
      await storage.updateUser(user.id, { password: hashed, resetToken: null, resetTokenExpires: null } as any);
      res.json({ success: true, message: "Mot de passe réinitialisé avec succès. Vous pouvez vous connecter." });
    } catch (error) {
      console.error("reset-password error:", error);
      res.status(500).json({ message: "Erreur serveur." });
    }
  });
}

// ─── Middleware isAuthenticated ──────────────────────────────────────────────

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Non authentifié." });
};

// ─── Middleware requireTailor ────────────────────────────────────────────────

export const requireTailor: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Non authentifié." });
  }
  const user = req.user as any;
  if (user.role !== "tailor") {
    return res.status(403).json({ message: "Accès refusé. Compte professionnel requis." });
  }
  return next();
};

// ─── Middleware requireClient ────────────────────────────────────────────────

export const requireClient: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Non authentifié." });
  }
  const user = req.user as any;
  if (user.role !== "client") {
    return res.status(403).json({ message: "Accès refusé. Compte client requis." });
  }
  return next();
};

import multer from "multer";
import path from "path";
import fs from "fs";

// On Railway, set UPLOADS_DIR=/app/uploads (persistent volume mount path).
// Fallback: /app/uploads if RAILWAY_ENVIRONMENT is detected, else local uploads/.
export const uploadsDir =
  process.env.UPLOADS_DIR ||
  (process.env.RAILWAY_ENVIRONMENT ? "/app/uploads" : path.join(process.cwd(), "uploads"));

const docsDir = path.join(uploadsDir, "docs");
const contractsDir = path.join(uploadsDir, "contracts");
const portfolioDir = path.join(uploadsDir, "portfolio");

// Create all required directories at startup — fail loudly if the volume is not mounted.
for (const dir of [uploadsDir, docsDir, contractsDir, portfolioDir]) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[upload] Directory ready: ${dir}`);
  } catch (err: any) {
    console.error(`[upload] FATAL — cannot create directory ${dir}: ${err.message}`);
  }
}

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, docsDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const portfolioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, portfolioDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non autorisé. Seuls JPG, PNG et WebP sont acceptés."));
  }
};

const docFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non autorisé. Seuls PDF, JPG et PNG sont acceptés."));
  }
};

export const uploadDoc = multer({
  storage: docStorage,
  fileFilter: docFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("file");

export const uploadPortfolio = multer({
  storage: portfolioStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
}).single("image");

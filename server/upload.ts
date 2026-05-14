import multer from "multer";
import path from "path";
import fs from "fs";

// On Railway, RAILWAY_VOLUME_MOUNT_PATH points to the persistent volume.
// Fall back to /app/uploads in production (if volume is mounted there), then local.
export const uploadsDir =
  process.env.UPLOADS_DIR ||
  (process.env.RAILWAY_ENVIRONMENT ? "/app/uploads" : path.join(process.cwd(), "uploads"));
const docsDir = path.join(uploadsDir, "docs");
const contractsDir = path.join(uploadsDir, "contracts");

// Ensure directories exist
fs.mkdirSync(docsDir, { recursive: true });
fs.mkdirSync(contractsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, docsDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const fileFilter = (
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
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("file");

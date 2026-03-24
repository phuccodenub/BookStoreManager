import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { basename, extname, posix, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { env } from '../config/index.js';
import { AppError } from '../errors/index.js';

const ALLOWED_IMAGE_TYPES = {
  'image/gif': ['.gif'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
} as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

type UploadLike = Pick<Express.Multer.File, 'mimetype' | 'originalname'>;

export function resolveUploadExtension(file: UploadLike): string {
  const allowedExtensions = ALLOWED_IMAGE_TYPES[file.mimetype as keyof typeof ALLOWED_IMAGE_TYPES];
  if (!allowedExtensions) {
    throw AppError.badRequest(`File type ${file.mimetype} is not allowed`);
  }

  const originalExtension = extname(file.originalname).toLowerCase();
  if (originalExtension && !allowedExtensions.includes(originalExtension as never)) {
    throw AppError.badRequest(`File extension ${originalExtension} does not match its MIME type`);
  }

  return allowedExtensions[0];
}

export function buildPublicFileUrl(
  baseUrl: string,
  uploadDir: string,
  filename: string,
): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const normalizedUploadDir = uploadDir
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  return `${normalizedBaseUrl}/${posix.join(normalizedUploadDir, filename)}`;
}

/* Ensure upload dir exists */
mkdirSync(env.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, env.UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const ext = resolveUploadExtension(file);
    cb(null, `${randomUUID()}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (ALLOWED_IMAGE_TYPES[file.mimetype as keyof typeof ALLOWED_IMAGE_TYPES]) {
    cb(null, true);
  } else {
    cb(AppError.badRequest(`File type ${file.mimetype} is not allowed`));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/** Build public URL from filename */
export function fileUrl(filename: string): string {
  return buildPublicFileUrl(env.APP_BASE_URL, env.UPLOAD_DIR, filename);
}

export async function deleteUploadedFile(filenameOrUrl: string): Promise<void> {
  const filename = basename(filenameOrUrl);
  if (!filename) {
    return;
  }

  try {
    await unlink(resolve(env.UPLOAD_DIR, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

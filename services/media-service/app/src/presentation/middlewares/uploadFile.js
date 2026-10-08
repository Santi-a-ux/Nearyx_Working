import multer from 'multer';
import { config } from '../../config/env.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
}).single('file');

const missing = (field) => ({ loc: ['body', field], msg: 'Field required', type: 'missing' });

/** Parses multipart (`file` + `type`) into req.file / req.body; 422 when either is absent, like FastAPI. */
export const uploadFile = (req, res, next) => {
  upload(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ detail: 'File too large' });
    if (err && !(err instanceof multer.MulterError)) return next(err);

    const detail = [];
    if (!req.file) detail.push(missing('file'));
    if (!req.body?.type) detail.push(missing('type'));
    if (detail.length) return res.status(422).json({ detail });
    next();
  });
};

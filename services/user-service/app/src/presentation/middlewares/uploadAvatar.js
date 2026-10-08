import multer from 'multer';
import { config } from '../../config/env.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxAvatarBytes, files: 1 },
}).single('file');

const missingFile = {
  detail: [{ loc: ['body', 'file'], msg: 'Field required', type: 'missing' }],
};

/** Parses the multipart body into req.file; answers 422 (like FastAPI's File(...)) when it is absent. */
export const uploadAvatar = (req, res, next) => {
  upload(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ detail: 'File too large' });
    if (err instanceof multer.MulterError) return res.status(422).json(missingFile);
    if (err) return next(err);
    if (!req.file) return res.status(422).json(missingFile);
    next();
  });
};

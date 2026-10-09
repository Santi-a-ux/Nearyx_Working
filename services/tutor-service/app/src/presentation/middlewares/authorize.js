import { ForbiddenError } from '../../domain/errors/index.js';

const requireRole = (role, message) => (req, res, next) => {
  if (req.user?.role !== role) throw new ForbiddenError(message);
  next();
};

export const requireTutor = requireRole('tutor', 'Operación permitida solo para tutores');
export const requireAdmin = requireRole('admin', 'Operación permitida solo para administradores');

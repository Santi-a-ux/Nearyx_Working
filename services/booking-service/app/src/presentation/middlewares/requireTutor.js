import { ForbiddenRoleError } from '../../domain/errors/index.js';

// Port of require_tutor_role (defined in dependencies.py but not used by any route yet).
// Usage: router.post('/x', authenticate, requireTutor, handler)
export const requireTutor = (req, res, next) => {
  if (req.user?.role !== 'tutor') throw new ForbiddenRoleError();
  next();
};

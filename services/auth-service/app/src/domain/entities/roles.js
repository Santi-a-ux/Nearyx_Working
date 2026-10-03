export const ROLES = Object.freeze({
  STUDENT: 'student',
  TUTOR: 'tutor',
  ADMIN: 'admin',
});

export const isValidRole = (role) => Object.values(ROLES).includes(role);

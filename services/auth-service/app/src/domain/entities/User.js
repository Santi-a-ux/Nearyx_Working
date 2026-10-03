import { ROLES } from './roles.js';

export class User {
  constructor({ id, email, passwordHash, role, isActive, createdAt, updatedAt }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  promoteToTutor() {
    this.role = ROLES.TUTOR;
  }
}

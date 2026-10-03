import bcrypt from 'bcryptjs';

// bcrypt with 12 rounds (passlib default); hashes are compatible with existing $2b$ hashes.
export class PasswordHasher {
  hash(plain) {
    return bcrypt.hash(plain, 12);
  }

  verify(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }
}

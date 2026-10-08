export class UserProfile {
  constructor({
    id = null, userId, displayName, bio = null, avatarUrl = null, locationName = null,
    createdAt = null, updatedAt = null,
  }) {
    this.id = id;
    this.userId = userId;
    this.displayName = displayName;
    this.bio = bio;
    this.avatarUrl = avatarUrl;
    this.locationName = locationName;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static create({ userId, displayName, bio, avatarUrl, locationName }) {
    return new UserProfile({ userId, displayName, bio, avatarUrl, locationName });
  }

  /** Partial update: null / undefined fields are left untouched (same as the Python `is not None` loop). */
  applyChanges({ displayName, bio, avatarUrl, locationName }) {
    if (displayName != null) this.displayName = displayName;
    if (bio != null) this.bio = bio;
    if (avatarUrl != null) this.avatarUrl = avatarUrl;
    if (locationName != null) this.locationName = locationName;
    return this;
  }
}

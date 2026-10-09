export class TutorProfile {
  constructor({
    id = null, userId, specialties = null, categories = null, isAvailable = true, hourlyRate = null,
    yearsExperience = null, verificationStatus = 'unverified', preferredPaymentMethod = null,
    lat = null, lng = null, createdAt = null, updatedAt = null,
  }) {
    Object.assign(this, {
      id, userId, specialties, categories, isAvailable, hourlyRate, yearsExperience,
      verificationStatus, preferredPaymentMethod, lat, lng, createdAt, updatedAt,
    });
  }

  static create({ userId, isAvailable, ...rest }) {
    return new TutorProfile({ userId, isAvailable: isAvailable ?? true, ...rest });
  }

  /**
   * Partial update: null / undefined fields are left untouched (same as the Python `is not None` loop).
   * Location only changes when BOTH lat and lng are sent.
   */
  applyChanges({ specialties, categories, isAvailable, hourlyRate, yearsExperience, preferredPaymentMethod, lat, lng }) {
    const assign = (key, value) => { if (value != null) this[key] = value; };
    assign('specialties', specialties);
    assign('categories', categories);
    assign('isAvailable', isAvailable);
    assign('hourlyRate', hourlyRate);
    assign('yearsExperience', yearsExperience);
    assign('preferredPaymentMethod', preferredPaymentMethod);

    const coordinatesChanged = lat != null && lng != null;
    if (coordinatesChanged) {
      this.lat = lat;
      this.lng = lng;
    }
    return { coordinatesChanged, profileTextChanged: specialties != null || categories != null };
  }
}

import { InvalidTimeRangeError } from '../errors/index.js';

export class Booking {
  constructor({
    id = null, studentId, tutorId, scheduledStart, scheduledEnd,
    status = 'pending', sessionNotes = null, createdAt = null, updatedAt = null,
  }) {
    this.id = id;
    this.studentId = studentId;
    this.tutorId = tutorId;
    this.scheduledStart = scheduledStart;
    this.scheduledEnd = scheduledEnd;
    this.status = status;
    this.sessionNotes = sessionNotes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static create({ studentId, tutorId, scheduledStart, scheduledEnd }) {
    if (scheduledEnd <= scheduledStart) throw new InvalidTimeRangeError();
    return new Booking({ studentId, tutorId, scheduledStart, scheduledEnd, status: 'pending' });
  }

  isParticipant(userId) {
    return userId === this.studentId || userId === this.tutorId;
  }
}

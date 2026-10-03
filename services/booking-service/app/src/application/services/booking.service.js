import { Booking } from '../../domain/entities/Booking.js';
import { BookingNotFoundError, NotAuthorizedError } from '../../domain/errors/index.js';

export class BookingService {
  constructor({ bookingRepository }) {
    this.bookingRepository = bookingRepository;
  }

  /** The authenticated user is the student; the tutor comes from the request. */
  createBooking(studentId, { tutorId, scheduledStart, scheduledEnd }) {
    const booking = Booking.create({ studentId, tutorId, scheduledStart, scheduledEnd });
    return this.bookingRepository.create(booking);
  }

  listMyBookings(userId) {
    return this.bookingRepository.findByParticipant(userId);
  }

  async updateStatus(userId, bookingId, status) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new BookingNotFoundError();
    if (!booking.isParticipant(userId)) throw new NotAuthorizedError();
    return this.bookingRepository.updateStatus(bookingId, status);
  }
}

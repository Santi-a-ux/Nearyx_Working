import { toBookingDto } from '../dtos/booking.dto.js';

export class BookingController {
  constructor(bookingService) {
    this.bookingService = bookingService;
  }

  create = async (req, res) => {
    const { tutor_id, scheduled_start, scheduled_end } = req.valid.body;
    const booking = await this.bookingService.createBooking(req.user.userId, {
      tutorId: tutor_id,
      scheduledStart: scheduled_start,
      scheduledEnd: scheduled_end,
    });
    res.status(201).json(toBookingDto(booking));
  };

  listMine = async (req, res) => {
    const bookings = await this.bookingService.listMyBookings(req.user.userId);
    res.json(bookings.map(toBookingDto));
  };

  updateStatus = async (req, res) => {
    const booking = await this.bookingService.updateStatus(
      req.user.userId,
      req.valid.params.booking_id,
      req.valid.body.status,
    );
    res.json(toBookingDto(booking));
  };
}

export const toBookingDto = (b) => ({
  id: b.id,
  student_id: b.studentId,
  tutor_id: b.tutorId,
  scheduled_start: b.scheduledStart,
  scheduled_end: b.scheduledEnd,
  status: b.status,
  created_at: b.createdAt,
  updated_at: b.updatedAt,
});

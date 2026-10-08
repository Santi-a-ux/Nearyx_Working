export class Conversation {
  constructor({ id = null, participantIds, createdAt = null, updatedAt = null }) {
    this.id = id;
    this.participantIds = participantIds;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isParticipant(userId) {
    return this.participantIds.includes(userId);
  }

  otherParticipantId(userId) {
    return this.participantIds.find((id) => id !== userId) ?? null;
  }

  recipientsFor(senderId) {
    return this.participantIds.filter((id) => id !== senderId);
  }
}

"""add tutor ratings

Revision ID: c4a2b8f91d7e
Revises: b3f9d2a9c1d2
Create Date: 2026-05-30 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c4a2b8f91d7e'
down_revision: Union[str, None] = 'b3f9d2a9c1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'ratings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('tutor_user_id', sa.UUID(), nullable=False),
        sa.Column('rater_user_id', sa.UUID(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='ck_tutor_ratings_rating_range'),
        sa.ForeignKeyConstraint(['tutor_user_id'], ['tutors.profiles.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tutor_user_id', 'rater_user_id', name='uq_tutor_ratings_tutor_rater'),
        schema='tutors',
    )
    op.create_index('ix_tutors_ratings_tutor_user_id', 'ratings', ['tutor_user_id'], schema='tutors')
    op.create_index('ix_tutors_ratings_rater_user_id', 'ratings', ['rater_user_id'], schema='tutors')


def downgrade() -> None:
    op.drop_index('ix_tutors_ratings_rater_user_id', table_name='ratings', schema='tutors')
    op.drop_index('ix_tutors_ratings_tutor_user_id', table_name='ratings', schema='tutors')
    op.drop_table('ratings', schema='tutors')

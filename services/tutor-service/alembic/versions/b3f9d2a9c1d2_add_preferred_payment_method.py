"""add preferred payment method

Revision ID: b3f9d2a9c1d2
Revises: 758e60542a00
Create Date: 2026-05-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b3f9d2a9c1d2'
down_revision: Union[str, None] = '758e60542a00'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('preferred_payment_method', sa.String(length=50), nullable=True), schema='tutors')


def downgrade() -> None:
    op.drop_column('profiles', 'preferred_payment_method', schema='tutors')

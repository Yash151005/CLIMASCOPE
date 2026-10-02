"""Create application tables and the PostGIS decision point index."""

from alembic import op
from sqlalchemy import inspect, text

from app.db.session import Base
import app.db.models  # noqa: F401 - register ORM tables on metadata

revision = "0001_initial_postgis"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    Base.metadata.create_all(bind=bind)
    columns = {item["name"] for item in inspect(bind).get_columns("decision_audits")}
    if "record_kind" not in columns:
        op.execute(
            "ALTER TABLE decision_audits "
            "ADD COLUMN record_kind VARCHAR(32) NOT NULL DEFAULT 'user-audit'"
        )
    if bind.dialect.name == "postgresql":
        columns = {item["name"] for item in inspect(bind).get_columns("decision_audits")}
        if "location_geom" not in columns:
            op.execute(
                "ALTER TABLE decision_audits "
                "ADD COLUMN location_geom geometry(Point, 4326)"
            )
        op.execute(
            "UPDATE decision_audits SET location_geom = "
            "ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) "
            "WHERE location_geom IS NULL"
        )
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_decision_audits_location_geom "
            "ON decision_audits USING GIST (location_geom)"
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP INDEX IF EXISTS ix_decision_audits_location_geom")
        op.execute("ALTER TABLE decision_audits DROP COLUMN IF EXISTS location_geom")
    Base.metadata.drop_all(bind=bind)

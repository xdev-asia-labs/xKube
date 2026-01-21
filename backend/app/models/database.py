"""
Database models for xKube
"""
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey, Float, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid
from datetime import datetime

from app.database import Base


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    clusters = relationship("Cluster", back_populates="owner", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"


class RefreshToken(Base):
    """Refresh Token model"""
    __tablename__ = "refresh_tokens"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")

    def __repr__(self):
        return f"<RefreshToken {self.id}>"



class Cluster(Base):
    """Kubernetes Cluster model"""
    __tablename__ = "clusters"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    
    # Encrypted kubeconfig
    kubeconfig_encrypted = Column(Text, nullable=False)
    context = Column(String(255), nullable=False)
    
    # Status
    is_active = Column(Boolean, default=False, nullable=False)
    is_connected = Column(Boolean, default=False, nullable=False)
    
    # Metadata
    version = Column(String(50), nullable=True)
    node_count = Column(Float, default=0)
    pod_count = Column(Float, default=0)
    tags = Column(JSON, nullable=True, default=list)
    
    # Ownership
    owner_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_connected_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner = relationship("User", back_populates="clusters")
    events = relationship("Event", back_populates="cluster", cascade="all, delete-orphan")
    metrics = relationship("Metric", back_populates="cluster", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Cluster {self.name}>"


class Event(Base):
    """Kubernetes Event model with vector embeddings for AI"""
    __tablename__ = "events"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cluster_id = Column(PG_UUID(as_uuid=True), ForeignKey("clusters.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Event data
    event_type = Column(String(100), nullable=False, index=True)  # Pod, Deployment, Node, etc.
    action = Column(String(50), nullable=False, index=True)  # Created, Updated, Deleted
    resource_name = Column(String(255), nullable=False, index=True)
    namespace = Column(String(255), nullable=False, index=True)
    message = Column(Text, nullable=False)
    
    # Additional data - renamed from metadata to avoid SQLAlchemy reserved keyword
    extra_data = Column(JSON, nullable=True, default=dict)
    severity = Column(String(20), nullable=False, default="info", index=True)  # info, warning, error, critical
    
    # AI vector embedding (1536 dimensions for OpenAI text-embedding-3-small)
    embedding = Column(Vector(1536), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    cluster = relationship("Cluster", back_populates="events")

    # Indexes for performance
    __table_args__ = (
        Index('idx_events_cluster_created', 'cluster_id', 'created_at'),
        Index('idx_events_severity_created', 'severity', 'created_at'),
    )

    def __repr__(self):
        return f"<Event {self.event_type}/{self.action} {self.resource_name}>"


class Metric(Base):
    """Kubernetes Metrics model"""
    __tablename__ = "metrics"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cluster_id = Column(PG_UUID(as_uuid=True), ForeignKey("clusters.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Metric data
    metric_type = Column(String(100), nullable=False, index=True)  # cpu, memory, network_in, network_out, disk_io
    metric_name = Column(String(255), nullable=False)  # Specific metric name
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)  # bytes, cores, percentage, etc.
    
    # Labels for filtering
    labels = Column(JSON, nullable=True, default=dict)  # {namespace, pod, node, etc.}
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    cluster = relationship("Cluster", back_populates="metrics")

    # Indexes for time-series queries
    __table_args__ = (
        Index('idx_metrics_cluster_type_time', 'cluster_id', 'metric_type', 'timestamp'),
    )

    def __repr__(self):
        return f"<Metric {self.metric_type}={self.value}>"

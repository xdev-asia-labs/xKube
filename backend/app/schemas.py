"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    avatar_url: Optional[str] = None
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Cluster Schemas
class ClusterBase(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class ClusterCreate(ClusterBase):
    kubeconfig: Optional[str] = None  # Plain text kubeconfig (will be encrypted on save)
    context: Optional[str] = None
    context_name: Optional[str] = None  # For importing from ~/.kube/config


class ClusterUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    kubeconfig: Optional[str] = None
    context: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ClusterResponse(ClusterBase):
    id: UUID
    context: str
    is_active: bool
    is_connected: bool
    version: Optional[str] = None
    node_count: int
    pod_count: int
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    last_connected_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClusterConnectionTest(BaseModel):
    connected: bool
    version: Optional[str] = None
    error: Optional[str] = None


# Event Schemas
class EventBase(BaseModel):
    event_type: str
    action: str
    resource_name: str
    namespace: str
    message: str
    severity: str = "info"


class EventCreate(EventBase):
    cluster_id: UUID
    metadata: Optional[dict] = Field(default_factory=dict)


class EventResponse(EventBase):
    id: UUID
    cluster_id: UUID
    metadata: dict
    created_at: datetime

    class Config:
        from_attributes = True


class EventSearchRequest(BaseModel):
    query: str
    limit: int = Field(default=10, le=100)
    cluster_id: Optional[UUID] = None


# Metric Schemas
class MetricCreate(BaseModel):
    cluster_id: UUID
    metric_type: str
    metric_name: str
    value: float
    unit: Optional[str] = None
    labels: Optional[dict] = Field(default_factory=dict)


class MetricResponse(BaseModel):
    id: UUID
    cluster_id: UUID
    metric_type: str
    metric_name: str
    value: float
    unit: Optional[str] = None
    labels: dict
    timestamp: datetime

    class Config:
        from_attributes = True

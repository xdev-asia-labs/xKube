-- Initialize database with pgvector extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE xkube TO postgres;

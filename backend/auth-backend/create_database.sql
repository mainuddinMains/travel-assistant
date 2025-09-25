-- Initialize the travel_assistant_auth database
-- This file is executed when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- But we can add any additional setup here

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The actual tables will be created by Alembic migrations
-- This file is mainly for any initial database setup that needs to happen
-- before the application starts

-- You can add any initial data or additional setup here

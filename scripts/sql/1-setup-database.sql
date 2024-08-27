CREATE EXTENSION IF NOT EXISTS dblink;
-- Check if the database exists
DO $do$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_database
        WHERE datname = '{{DB_NAME}}'
    ) THEN
        RAISE NOTICE 'Database "{{DB_NAME}}" already exists. Skipping creation.';
    ELSE
        PERFORM dblink_exec('dbname={{DB_NAME}}', 'CREATE DATABASE {{DB_NAME}}');
    END IF;
END $do$;

CREATE SCHEMA IF NOT EXISTS private;

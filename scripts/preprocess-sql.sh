#!/bin/bash

set -e

# Load environment variables from .env file
export $(grep -v '^#' ../.env | xargs)

# Default database name if not set in .env
DB_NAME=${DATABASE:-default_db}

# Paths to SQL files
SQL_FILE_PATH="$(dirname "$0")/sql/1-setup-database.sql"
PROCESSED_FILE_PATH="$(dirname "$0")/sql/0-setup-processed.sql"

# Read the SQL file
if [ ! -f "$SQL_FILE_PATH" ]; then
  echo "SQL file not found: $SQL_FILE_PATH"
  exit 1
fi

# Replace placeholders in SQL file
sed "s/{{DB_NAME}}/$DB_NAME/g" "$SQL_FILE_PATH" > "$PROCESSED_FILE_PATH"

echo "Processed SQL file saved to $PROCESSED_FILE_PATH"

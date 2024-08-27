#!/bin/bash

set -e

# Load environment variables from .env file
export $(grep -v '^#' ./.env | xargs)

# PostgreSQL client configuration
PGHOST=$DB_HOST
PGUSER=$PG_USER
PGPORT=$PG_PORT
PGPASSWORD=$PG_PASSWORD
PGDATABASE=$DATABASE

# Directory containing SQL files
SQL_DIRECTORY="$(dirname "$0")/sql"
PROCESSED_FILE_PATH="$SQL_DIRECTORY/0-setup-processed.sql"

# Function to execute SQL files
execute_sql_files() {
  # Check if processed file exists
  if [ ! -f "$PROCESSED_FILE_PATH" ]; then
    echo "Processed file not found in the directory."
    exit 1
  fi

  # Read all SQL files from the directory
  files=$(ls "$SQL_DIRECTORY"/*.sql 2>/dev/null)

  # Exclude the 1-setup-database.sql file
  files=$(echo "$files" | grep -v '1-setup-database.sql')

  # Sort files by their prefix number
  sorted_files=$(echo "$files" | sort -t'_' -k1,1n)

  for file in $sorted_files; do
    echo "Executing $(basename "$file")..."
    
    PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f "$file"
    
    echo "$(basename "$file") executed successfully."
  done

  echo "Sorted Files"
  echo $sorted_files
  echo "Processed file path"
  echo $PROCESSED_FILE_PATH
  
  # Remove the temporary processed file
  if [ -f "$PROCESSED_FILE_PATH" ]; then
    rm "$PROCESSED_FILE_PATH"
    echo "Temporary processed file removed."
  fi

  echo "All SQL scripts executed successfully."
}

execute_sql_files
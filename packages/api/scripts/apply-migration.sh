#!/bin/bash
# Script to apply Prisma migrations directly using DIRECT_URL
# This bypasses Prisma's shadow database which can fail with pooler connections

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if DIRECT_URL is set
if [ -z "$DIRECT_URL" ]; then
  echo "Error: DIRECT_URL is not set in .env file"
  echo "Please set DIRECT_URL to the direct database connection string (not pooler)"
  exit 1
fi

# Find the latest migration
LATEST_MIGRATION=$(ls -t prisma/migrations | head -1)
MIGRATION_FILE="prisma/migrations/$LATEST_MIGRATION/migration.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "Applying migration: $LATEST_MIGRATION"
echo "Using DIRECT_URL connection..."

# Apply migration directly using psql
psql "$DIRECT_URL" -f "$MIGRATION_FILE"

# Mark migration as applied in Prisma
echo "Marking migration as applied..."
npx prisma migrate resolve --applied "$LATEST_MIGRATION"

echo "Migration applied successfully!"

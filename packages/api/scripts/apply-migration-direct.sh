#!/bin/bash
# Alternative script that uses Prisma's db execute with DIRECT_URL
# This is more reliable when psql is not available

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if DIRECT_URL is set
if [ -z "$DIRECT_URL" ]; then
  echo "Error: DIRECT_URL is not set in .env file"
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

# Use Prisma db execute with DIRECT_URL
DIRECT_URL="$DIRECT_URL" npx prisma db execute --file "$MIGRATION_FILE" --schema prisma/schema.prisma

# Mark migration as applied
echo "Marking migration as applied..."
npx prisma migrate resolve --applied "$LATEST_MIGRATION"

echo "Migration applied successfully!"

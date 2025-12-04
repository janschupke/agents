#!/bin/bash
# Migration script that avoids shadow database issues
# Creates migration and applies it directly
# Usage: ./migrate-dev.sh [migration-name]
# If migration-name is not provided, Prisma will prompt for it

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

# Get migration name from argument (optional)
MIGRATION_NAME="$1"

# If no name provided, generate one based on timestamp
if [ -z "$MIGRATION_NAME" ]; then
  MIGRATION_NAME="migration_$(date +%Y%m%d%H%M%S)"
  echo "No migration name provided, using: $MIGRATION_NAME"
fi

echo "Creating migration: $MIGRATION_NAME"
echo "Using migrate diff to avoid shadow database issues..."

# Get the current database schema as SQL
echo "Introspecting current database schema..."
CURRENT_SCHEMA="/tmp/current_schema.sql"
npx prisma db execute --stdin --schema prisma/schema.prisma <<< "SELECT current_database();" > /dev/null 2>&1 || true

# Use migrate diff to generate migration SQL by comparing schema to database
# This completely bypasses shadow database validation
echo "Generating migration SQL..."
MIGRATION_SQL=$(npx prisma migrate diff \
  --from-url "$DIRECT_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script 2>&1) || {
  echo "Error: Failed to generate migration SQL"
  echo "$MIGRATION_SQL"
  exit 1
}

# Check if there are actual changes or if it's an error
if echo "$MIGRATION_SQL" | grep -qi "error\|failed"; then
  echo "Error generating migration:"
  echo "$MIGRATION_SQL"
  exit 1
fi

if [ -z "$MIGRATION_SQL" ] || echo "$MIGRATION_SQL" | grep -qi "no schema changes\|no difference"; then
  echo "No schema changes detected. Nothing to migrate."
  exit 0
fi

# Create migration directory with timestamp prefix
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_DIR="prisma/migrations/${TIMESTAMP}_${MIGRATION_NAME}"
mkdir -p "$MIGRATION_DIR"

# Write migration SQL to file
echo "$MIGRATION_SQL" > "$MIGRATION_DIR/migration.sql"

echo "Migration file created: $MIGRATION_DIR/migration.sql"

MIGRATION_FILE="$MIGRATION_DIR/migration.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

# Set migration ID for later use
MIGRATION_ID="${TIMESTAMP}_${MIGRATION_NAME}"

echo ""
echo "Applying migration: $MIGRATION_ID"
echo "Using DIRECT_URL connection..."

# Apply migration directly using Prisma db execute
DIRECT_URL="$DIRECT_URL" npx prisma db execute --file "$MIGRATION_FILE" --schema prisma/schema.prisma

# Mark migration as applied using the directory name
echo "Marking migration as applied..."
npx prisma migrate resolve --applied "$MIGRATION_ID"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo ""
echo "Migration created and applied successfully!"
echo "Migration: $MIGRATION_ID"

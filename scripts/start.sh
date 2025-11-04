#!/usr/bin/env bash
set -e

echo "Starting backend..."

# Step 1: Try to download the database file from S3
echo "Downloading database from S3..."
aws s3 cp s3://$S3_BUCKET_NAME/db.sqlite3 ./db.sqlite3 || echo "No existing db.sqlite3 found on S3"

# Step 2: Apply migrations
echo "Applying Django migrations..."
python manage.py migrate --noinput

# Step 3: Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Step 4: Start background watcher to upload database on changes
echo "Starting DB watcher..."
python scripts/watch_db.py &

# Step 5: Launch the Django app
echo "Starting Gunicorn..."
gunicorn api.wsgi:application --bind 0.0.0.0:$PORT

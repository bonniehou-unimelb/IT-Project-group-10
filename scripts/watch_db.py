import time
import os
import boto3
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "")
DB_PATH = "db.sqlite3"

s3 = boto3.client("s3")

class DBChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith(DB_PATH):
            print("Database changed. Uploading to S3...")
            try:
                s3.upload_file(DB_PATH, BUCKET_NAME, DB_PATH)
                print("Database uploaded successfully.")
            except Exception as e:
                print(f"Error uploading database: {e}")

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print("No db.sqlite3 found, skipping watcher.")
    else:
        print("Watching for database changes...")
        event_handler = DBChangeHandler()
        observer = Observer()
        observer.schedule(event_handler, ".", recursive=False)
        observer.start()

        try:
            while True:
                time.sleep(10)
        except KeyboardInterrupt:
            observer.stop()
        observer.join()

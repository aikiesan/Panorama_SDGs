import os
import sys
from pathlib import Path

# Add backend to path to import config
sys.path.append(str(Path(__file__).parent.parent / "backend"))

try:
    from app.core.supabase import get_supabase_client
    from app.core.config import settings
except ImportError as e:
    print(f"Error importing backend modules: {e}")
    sys.exit(1)

def test_connection():
    print("=== Supabase Storage Diagnostic ===")
    print(f"URL: {settings.SUPABASE_URL}")
    print(f"Key length: {len(settings.SUPABASE_SERVICE_ROLE_KEY) if settings.SUPABASE_SERVICE_ROLE_KEY else 0} chars")
    
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        print("\nERROR: Supabase credentials missing in backend/.env")
        return

    try:
        supabase = get_supabase_client()
        bucket_name = "project-images"
        
        print(f"\nChecking for bucket: '{bucket_name}'...")
        
        try:
            # Try to list files in the bucket
            buckets = supabase.storage.list_buckets()
            bucket_names = [b.name for b in buckets]
            
            if bucket_name in bucket_names:
                print(f"SUCCESS: Bucket '{bucket_name}' exists.")
                
                # Check if it's public
                target_bucket = next(b for b in buckets if b.name == bucket_name)
                if target_bucket.public:
                    print("SUCCESS: Bucket is PUBLIC (required for map display).")
                else:
                    print("WARNING: Bucket is PRIVATE. Images may not show up on the public map.")
            else:
                print(f"ERROR: Bucket '{bucket_name}' NOT FOUND.")
                print(f"Existing buckets: {', '.join(bucket_names) if bucket_names else 'None'}")
                print("\nPlease create a PUBLIC bucket named 'project-images' in your Supabase Dashboard.")
                
        except Exception as e:
            print(f"ERROR connecting to Supabase Storage: {e}")
            
    except Exception as e:
        print(f"ERROR initializing Supabase client: {e}")

if __name__ == "__main__":
    test_connection()

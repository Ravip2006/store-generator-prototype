import subprocess
import sys
import os

def generate_and_upload(prompt, output_path, api_token, upload_bucket, upload_tenant, upload_dest):
    # Step 1: Generate image using Hugging Face API
    print("Generating image with Hugging Face API...")
    result = subprocess.run([
        sys.executable, "generate_hf_image.py", prompt, output_path, api_token
    ])
    if result.returncode != 0:
        print("Image generation failed.")
        sys.exit(1)
    print("Image generated.")

    # Step 2: Upload to Supabase Storage
    print("Uploading image to Supabase Storage...")
    upload_script = "upload-to-supabase-storage.mjs"
    upload_args = [
        "node", upload_script, upload_bucket, upload_tenant, output_path, upload_dest
    ]
    result = subprocess.run(upload_args)
    if result.returncode != 0:
        print("Upload failed.")
        sys.exit(1)
    print("Upload successful.")

if __name__ == "__main__":
    if len(sys.argv) < 7:
        print("Usage: python generate_and_upload.py '<prompt>' <output_path> <huggingface_api_token> <bucket> <tenant> <dest_path>")
        sys.exit(1)
    prompt = sys.argv[1]
    output_path = sys.argv[2]
    api_token = sys.argv[3]
    upload_bucket = sys.argv[4]
    upload_tenant = sys.argv[5]
    upload_dest = sys.argv[6]
    generate_and_upload(prompt, output_path, api_token, upload_bucket, upload_tenant, upload_dest)

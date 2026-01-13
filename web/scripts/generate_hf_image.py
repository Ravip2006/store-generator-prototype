import requests
import sys
import os

def generate_image(prompt, output_path, api_token):
    # Hugging Face deprecated api-inference.huggingface.co in favor of router.huggingface.co.
    # Use the router + hf-inference provider path.
    #
    # Note: Not all models are available via this routed endpoint. We default to a
    # known-working text-to-image model, but allow override via env.
    model = os.environ.get("HF_IMAGE_MODEL") or "black-forest-labs/FLUX.1-schnell"
    url = f"https://router.huggingface.co/hf-inference/models/{model}"
    headers = {"Authorization": f"Bearer {api_token}"}
    payload = {"inputs": prompt}
    response = requests.post(url, headers=headers, json=payload, timeout=120)
    if response.status_code == 200 and response.headers.get('content-type', '').startswith('image'):
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"Image saved to {output_path}")
        return True
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python generate_hf_image.py '<prompt>' <output_path> <huggingface_api_token>")
        sys.exit(1)
    prompt = sys.argv[1]
    output_path = sys.argv[2]
    api_token = sys.argv[3]
    success = generate_image(prompt, output_path, api_token)
    if not success:
        sys.exit(2)

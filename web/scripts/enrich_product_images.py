import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import requests


USER_AGENT = "store-generator-prototype/1.0 (image-enrichment)"
OPENFOODFACTS_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl"


def _sleep_backoff(attempt: int) -> None:
    # attempt is 1-based
    time.sleep(min(8.0, 0.6 * (2 ** (attempt - 1))))


def _requests_get_with_retries(
    url: str,
    *,
    params: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
    stream: bool = False,
    timeout: float = 30,
    retries: int = 3,
) -> requests.Response:
    last_exc: Optional[Exception] = None
    for attempt in range(1, retries + 1):
        try:
            r = requests.get(url, params=params, headers=headers, stream=stream, timeout=timeout)
            return r
        except Exception as e:
            last_exc = e
            if attempt < retries:
                _sleep_backoff(attempt)
                continue
            raise


def _requests_post_with_retries(
    url: str,
    *,
    headers: Optional[Dict[str, str]] = None,
    json_payload: Optional[Dict[str, Any]] = None,
    timeout: float = 30,
    retries: int = 3,
) -> requests.Response:
    last_exc: Optional[Exception] = None
    for attempt in range(1, retries + 1):
        try:
            r = requests.post(url, headers=headers, json=json_payload, timeout=timeout)
            return r
        except Exception as e:
            last_exc = e
            if attempt < retries:
                _sleep_backoff(attempt)
                continue
            raise


def _load_dotenv_file(path: str) -> None:
    """Best-effort .env loader (no external deps).

    Only sets keys that are not already present in the environment.
    """

    try:
        with open(path, "r", encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip()
                if not key or key in os.environ:
                    continue

                if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                    val = val[1:-1]

                os.environ[key] = val
    except FileNotFoundError:
        return
    except Exception:
        return


def _env(key: str, default: Optional[str] = None) -> Optional[str]:
    v = os.environ.get(key)
    if v is None:
        return default
    v = str(v).strip()
    return v if v else default


def _slug(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9._-]", "", s)
    return s or "product"


def _safe_filename(name: str, default_ext: str = ".jpg") -> str:
    base = _slug(name)
    if not base.endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')):
        base += default_ext
    return base


def _guess_ext_from_content_type(content_type: str) -> str:
    ct = (content_type or "").split(";")[0].strip().lower()
    if ct == "image/jpeg":
        return ".jpg"
    if ct == "image/png":
        return ".png"
    if ct == "image/webp":
        return ".webp"
    if ct == "image/gif":
        return ".gif"
    return ".jpg"


def api_get_products(api_base: str, tenant: str) -> List[Dict[str, Any]]:
    r = _requests_get_with_retries(
        f"{api_base.rstrip('/')}/products",
        headers={"x-tenant-id": tenant, "user-agent": USER_AGENT},
        timeout=30,
        retries=3,
    )
    r.raise_for_status()
    data = r.json()
    return data if isinstance(data, list) else []


def api_patch_product_image(api_base: str, tenant: str, product_id: str, image_url: str) -> None:
    r = requests.patch(
        f"{api_base.rstrip('/')}/products/{requests.utils.quote(str(product_id))}",
        headers={
            "x-tenant-id": tenant,
            "content-type": "application/json",
            "user-agent": USER_AGENT,
        },
        json={"imageUrl": image_url},
        timeout=30,
    )
    if not r.ok:
        try:
            payload = r.json()
        except Exception:
            payload = {"raw": r.text[:200]}
        raise RuntimeError(f"PATCH /products/{product_id} failed ({r.status_code}): {payload}")


@dataclass
class ImageCandidate:
    url: str
    score: float
    source: str
    meta: Dict[str, Any]


def _tokenize(text: str) -> List[str]:
    return [t for t in re.split(r"[^a-z0-9]+", (text or "").lower()) if t and len(t) > 2]


def find_openfoodfacts_image(product_name: str) -> Optional[ImageCandidate]:
    # OpenFoodFacts images are community-contributed; ensure your usage complies with their license/terms.
    q = (product_name or "").strip()
    if not q:
        return None

    params = {
        "search_terms": q,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page_size": 10,
    }

    r = _requests_get_with_retries(
        OPENFOODFACTS_SEARCH_URL,
        params=params,
        headers={"user-agent": USER_AGENT},
        timeout=45,
        retries=3,
    )
    if not r.ok:
        return None

    payload = r.json() if isinstance(r.json(), dict) else {}
    products = payload.get("products")
    if not isinstance(products, list):
        return None

    name_tokens = set(_tokenize(product_name))

    best: Optional[ImageCandidate] = None
    for p in products:
        if not isinstance(p, dict):
            continue
        url = p.get("image_front_url") or p.get("image_url")
        if not isinstance(url, str) or not url.startswith("http"):
            continue

        candidate_name = str(p.get("product_name") or "")
        candidate_tokens = set(_tokenize(candidate_name))
        overlap = len(name_tokens.intersection(candidate_tokens))

        # Prefer https and front images.
        score = float(overlap)
        if url.startswith("https://"):
            score += 0.2
        if "image_front_url" in p and p.get("image_front_url") == url:
            score += 0.3

        cand = ImageCandidate(
            url=url,
            score=score,
            source="openfoodfacts",
            meta={
                "product_name": candidate_name,
                "code": p.get("code"),
                "image_front_url": p.get("image_front_url"),
                "image_url": p.get("image_url"),
                "link": p.get("url"),
            },
        )
        if best is None or cand.score > best.score:
            best = cand

    return best


def download_image(url: str, dest_dir: str, base_name: str) -> Tuple[str, str]:
    r = _requests_get_with_retries(
        url,
        headers={"user-agent": USER_AGENT},
        stream=True,
        timeout=60,
        retries=3,
    )
    r.raise_for_status()

    content_type = r.headers.get("content-type", "")
    ext = _guess_ext_from_content_type(content_type)
    file_name = _safe_filename(base_name, default_ext=ext)
    out_path = os.path.join(dest_dir, file_name)

    with open(out_path, "wb") as f:
        for chunk in r.iter_content(chunk_size=1024 * 64):
            if chunk:
                f.write(chunk)

    return out_path, content_type


def generate_ai_image_hf(
    *,
    script_dir: str,
    product_name: str,
    api_token: str,
    dest_dir: str,
    base_name: str,
) -> str:
    out_path = os.path.join(dest_dir, _safe_filename(base_name, default_ext=".jpg"))

    prompt = (
        "High-quality studio product photo, isolated on a clean white background. "
        "Retail e-commerce style. Soft shadow. "
        f"Product: {product_name}. "
        "No watermark."
    )

    cmd = [
        sys.executable,
        os.path.join(script_dir, "generate_hf_image.py"),
        prompt,
        out_path,
        api_token,
    ]

    last_error: Optional[str] = None
    for attempt in range(1, 4):
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and os.path.exists(out_path):
            return out_path

        last_error = f"HF generation failed: {res.stdout}\n{res.stderr}".strip()
        if attempt < 3:
            _sleep_backoff(attempt)
            continue
        raise RuntimeError(last_error)

    raise RuntimeError(last_error or "HF generation failed")


def upload_to_supabase(
    *,
    script_dir: str,
    bucket: str,
    tenant: str,
    file_path: str,
    dest_path: str,
) -> str:
    cmd = [
        "node",
        os.path.join(script_dir, "upload-to-supabase-storage.mjs"),
        bucket,
        tenant,
        file_path,
        dest_path,
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"Upload failed: {res.stdout}\n{res.stderr}")

    public_url = (res.stdout or "").strip().splitlines()[-1].strip()
    if not public_url.startswith("http"):
        raise RuntimeError(f"Upload did not return a public URL: {res.stdout}\n{res.stderr}")

    return public_url


def main() -> int:
    # Load env from common repo locations so users don't need to export vars.
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.abspath(os.path.join(script_dir, ".."))
    repo_dir = os.path.abspath(os.path.join(script_dir, "..", ".."))
    api_dir = os.path.join(repo_dir, "api")

    for p in (
        os.path.join(web_dir, ".env.local"),
        os.path.join(web_dir, ".env"),
        os.path.join(api_dir, ".env.local"),
        os.path.join(api_dir, ".env"),
    ):
        _load_dotenv_file(p)

    parser = argparse.ArgumentParser(
        description=(
            "Enrich product images by (1) downloading from open web datasets (OpenFoodFacts) "
            "and (2) falling back to AI image generation, uploading to Supabase Storage, and "
            "patching products via the API.\n\n"
            "Note: For web-downloaded images, ensure license/terms compliance for your use-case."
        )
    )
    parser.add_argument("--tenant", required=True, help="Store tenant slug (x-tenant-id)")
    parser.add_argument(
        "--api-base",
        default=_env("NEXT_PUBLIC_API_BASE_URL") or _env("API_BASE_URL") or "http://127.0.0.1:3001",
        help="API base URL (default: env or http://127.0.0.1:3001)",
    )
    parser.add_argument(
        "--bucket",
        default=_env("NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET") or "product-images",
        help="Supabase Storage bucket (default: env or product-images)",
    )
    parser.add_argument("--limit", type=int, default=50, help="Max products to process")
    parser.add_argument("--force", action="store_true", help="Overwrite even if imageUrl already set")
    parser.add_argument(
        "--source",
        choices=["auto", "openfoodfacts", "ai"],
        default="auto",
        help="Image source strategy",
    )
    parser.add_argument(
        "--hf-token",
        default=_env("HUGGINGFACE_API_TOKEN") or _env("HF_API_TOKEN"),
        help="Hugging Face API token (required for AI source or auto fallback)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Do not upload or patch; just report")

    args = parser.parse_args()

    tenant = args.tenant.strip().lower()
    api_base = str(args.api_base).strip()
    bucket = str(args.bucket).strip()

    products = api_get_products(api_base, tenant)

    to_process: List[Dict[str, Any]] = []
    for p in products:
        if not isinstance(p, dict):
            continue
        pid = str(p.get("id") or "").strip()
        if not pid:
            continue
        has_image = bool(str(p.get("imageUrl") or "").strip())
        if args.force or not has_image:
            to_process.append(p)

    to_process = to_process[: max(0, int(args.limit))]

    report: Dict[str, Any] = {
        "tenant": tenant,
        "apiBase": api_base,
        "bucket": bucket,
        "source": args.source,
        "force": bool(args.force),
        "dryRun": bool(args.dry_run),
        "processed": [],
        "skipped": len(products) - len(to_process),
    }

    if args.source in ("auto", "ai") and not args.hf_token and not args.dry_run:
        raise SystemExit(
            "Missing Hugging Face token. Set HUGGINGFACE_API_TOKEN (or pass --hf-token) to use AI generation."
        )

    with tempfile.TemporaryDirectory(prefix="storegen-images-") as tmp:
        for p in to_process:
            pid = str(p.get("id"))
            name = str(p.get("name") or "").strip() or f"product-{pid}"
            base_name = f"{pid}-{name}"

            result: Dict[str, Any] = {
                "id": pid,
                "name": name,
                "hadImage": bool(str(p.get("imageUrl") or "").strip()),
                "chosen": None,
                "uploadedUrl": None,
                "patched": False,
                "error": None,
            }

            try:
                candidate: Optional[ImageCandidate] = None
                if args.source in ("auto", "openfoodfacts"):
                    candidate = find_openfoodfacts_image(name)

                local_path: Optional[str] = None
                source_used: Optional[str] = None
                meta: Dict[str, Any] = {}

                if candidate and args.source in ("auto", "openfoodfacts"):
                    local_path, content_type = download_image(candidate.url, tmp, base_name)
                    source_used = candidate.source
                    meta = {"url": candidate.url, "contentType": content_type, **candidate.meta}

                if local_path is None and args.source in ("auto", "ai"):
                    if args.dry_run and not args.hf_token:
                        result["chosen"] = {
                            "source": "ai",
                            "localPath": None,
                            "meta": {"note": "dry-run: would generate via Hugging Face (token not provided)"},
                        }
                        report["processed"].append(result)
                        continue
                    local_path = generate_ai_image_hf(
                        script_dir=script_dir,
                        product_name=name,
                        api_token=str(args.hf_token),
                        dest_dir=tmp,
                        base_name=base_name,
                    )
                    source_used = "ai"

                if local_path is None:
                    result["chosen"] = None
                    result["error"] = "No image candidate found and AI disabled"
                    report["processed"].append(result)
                    continue

                result["chosen"] = {"source": source_used, "localPath": local_path, "meta": meta}

                dest_path = f"tenants/{tenant}/products/{_slug(pid)}-{_slug(name)}-{os.path.basename(local_path)}"

                if args.dry_run:
                    report["processed"].append(result)
                    continue

                public_url = upload_to_supabase(
                    script_dir=script_dir,
                    bucket=bucket,
                    tenant=tenant,
                    file_path=local_path,
                    dest_path=dest_path,
                )
                result["uploadedUrl"] = public_url

                api_patch_product_image(api_base, tenant, pid, public_url)
                result["patched"] = True

            except Exception as e:
                result["error"] = str(e)

            report["processed"].append(result)

    out_report = os.path.join(script_dir, f"image_enrichment_report_{tenant}.json")
    try:
        with open(out_report, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
    except Exception:
        pass

    ok = sum(1 for r in report["processed"] if r.get("patched"))
    failed = sum(1 for r in report["processed"] if r.get("error"))
    print(f"Processed {len(report['processed'])} products. Patched: {ok}. Failed: {failed}.")
    print(f"Report: {out_report}")

    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())

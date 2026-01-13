import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "crypto";

function tryLoadDotenvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (!key || process.env[key]) continue;
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    // ignore
  }
}

// Load env from common repo locations so users don't need to export vars.
const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const webDir = path.resolve(scriptDir, "..");
const repoDir = path.resolve(scriptDir, "..", "..");
const apiDir = path.resolve(repoDir, "api");

tryLoadDotenvFile(path.join(webDir, ".env.local"));
tryLoadDotenvFile(path.join(webDir, ".env"));
tryLoadDotenvFile(path.join(apiDir, ".env.local"));
tryLoadDotenvFile(path.join(apiDir, ".env"));

function requireEnv(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing ${key}`);
  return v;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");


const bucket = process.argv[2] || process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";
const tenant = (process.argv[3] || "green-mart").trim().toLowerCase();
const filePath = process.argv[4];
const customDestPath = process.argv[5];

if (!filePath) {
  console.error(
    "Usage: node scripts/upload-to-supabase-storage.mjs <bucket> <tenant> <filePath> [destPath]"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function contentTypeForPath(filePath) {
  const ext = path.extname(filePath || "").toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

const fileName = path.basename(filePath)
  .trim()
  .replace(/\s+/g, "-")
  .replace(/[^a-zA-Z0-9._-]/g, "")
  .toLowerCase();

let objectPath;
if (customDestPath) {
  objectPath = customDestPath;
} else {
  objectPath = `tenants/${tenant}/products/${randomUUID()}-${fileName}`;
}

let body;
try {
  body = fs.readFileSync(filePath);
} catch (err) {
  console.error(`Failed to read file: ${filePath}\n${err}`);
  process.exit(1);
}


try {
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, body, {
      upsert: false,
      contentType: contentTypeForPath(filePath),
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  if (!data?.publicUrl) {
    throw new Error("Failed to create public URL");
  }

  console.log(data.publicUrl);
} catch (err) {
  console.error(`Upload failed: ${err}`);
  process.exit(1);
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function canUseSupabaseStorage() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function safeFilename(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

export async function uploadProductImage(options: {
  bucket: string;
  tenant: string;
  file: File;
}) {
  const supabase = getSupabaseClient();

  const tenant = options.tenant.trim().toLowerCase();
  const file = options.file;
  const fileName = safeFilename(file.name || "image");
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());

  const path = `tenants/${tenant}/products/${id}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(options.bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(options.bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Failed to create public URL for uploaded image");
  }

  return { path, publicUrl: data.publicUrl };
}

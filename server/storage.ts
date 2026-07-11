import { ENV } from "./_core/env";
import { supabaseAdmin } from "./_core/supabase";

export async function getSignedUploadUrl(key: string, contentType: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(ENV.supabaseStorageBucket)
    .createSignedUploadUrl(key, { upsert: true });

  if (error) throw error;

  return {
    url: data.signedUrl,
    key,
    token: data.token,
    contentType,
  };
}

export async function storagePut(key: string, data: Buffer, contentType: string) {
  const { error } = await supabaseAdmin.storage
    .from(ENV.supabaseStorageBucket)
    .upload(key, data, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  const { data: publicUrl } = supabaseAdmin.storage
    .from(ENV.supabaseStorageBucket)
    .getPublicUrl(key);

  return { key, url: publicUrl.publicUrl };
}

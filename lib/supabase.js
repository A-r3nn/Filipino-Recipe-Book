import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

// Uploads one picture to the "recipe-images" bucket and returns its public link
export async function uploadImage(file) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("recipe-images").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("recipe-images").getPublicUrl(path).data.publicUrl;
}

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export type Category = { id: number; name: string };

export type Recipe = {
  id: number;
  title: string;
  description: string | null;
  cooking_time: string | null;
  servings: number | null;
  ingredients: string | null;
  instructions: string | null;
  image: string | null;
  image2: string | null;
  image3: string | null;
  category_id: number | null;
  categories: { name: string } | null;
};

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("recipe-images").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("recipe-images").getPublicUrl(path).data.publicUrl;
}

"use client";

import { useState } from "react";
import { supabase, uploadImage, type Category, type Recipe } from "@/lib/supabase";

type Props = {
  categories: Category[];
  recipe?: Recipe; // present = edit mode, missing = add mode
  onClose: () => void;
  onSaved: () => void;
};

export default function RecipeForm({ categories, recipe, onClose, onSaved }: Props) {
  const editing = !!recipe;
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [categoryId, setCategoryId] = useState<number>(recipe?.category_id ?? categories[0]?.id ?? 0);
  const [cookingTime, setCookingTime] = useState(recipe?.cooking_time ?? "");
  const [servings, setServings] = useState(String(recipe?.servings ?? 4));
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [ingredients, setIngredients] = useState(recipe?.ingredients ?? "");
  const [instructions, setInstructions] = useState(recipe?.instructions ?? "");
  const [files, setFiles] = useState<(File | null)[]>([null, null, null]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const existing = [recipe?.image ?? null, recipe?.image2 ?? null, recipe?.image3 ?? null];
  const labels = ["Image *", "Image 2 (optional)", "Image 3 (optional)"];

  function pickFile(i: number, file: File | null) {
    setFiles((prev) => prev.map((f, idx) => (idx === i ? file : f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (
      !title.trim() ||
      !cookingTime.trim() ||
      !servings ||
      Number(servings) < 1 ||
      !description.trim() ||
      !ingredients.trim() ||
      !instructions.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!files[0] && !existing[0]) {
      setError("Please choose a main image.");
      return;
    }

    setSaving(true);
    try {
      const urls = await Promise.all(
        files.map(async (f, i) => (f ? await uploadImage(f) : existing[i]))
      );
      const payload = {
        title: title.trim(),
        category_id: categoryId,
        cooking_time: cookingTime.trim() || null,
        servings: servings ? Number(servings) : null,
        description: description.trim() || null,
        ingredients: ingredients.trim() || null,
        instructions: instructions.trim() || null,
        image: urls[0],
        image2: urls[1],
        image3: urls[2],
      };
      const { error } = editing
        ? await supabase.from("recipes").update(payload).eq("id", recipe!.id)
        : await supabase.from("recipes").insert(payload);
      if (error) throw error;
      onSaved();
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" style={{ display: "flex" }}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>{editing ? "Edit Recipe" : "Add New Recipe"}</h2>
          <span className="close-modal" onClick={onClose}>&times;</span>
        </div>

        <form className="recipe-form" onSubmit={handleSubmit}>
          <div className="form-group full-width">
            <label>Recipe Name *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Cooking Time *</label>
              <input type="text" placeholder="e.g., 30 min" value={cookingTime} onChange={(e) => setCookingTime(e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Servings *</label>
              <input type="number" min={1} value={servings} onChange={(e) => setServings(e.target.value)} required />
            </div>
          </div>

          {labels.map((label, i) => (
            <div className="form-group full-width" key={label}>
              <label>{label}</label>
              <input type="file" accept="image/*" required={i === 0 && !existing[0]} onChange={(e) => pickFile(i, e.target.files?.[0] ?? null)} />
              {files[i] ? (
                <small>New file: {files[i]!.name}</small>
              ) : existing[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="thumb" src={existing[i]!} alt="Current" />
              ) : null}
            </div>
          ))}

          <div className="form-group full-width">
            <label>Description *</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="form-group full-width">
            <label>Ingredients (one per line) *</label>
            <textarea rows={4} placeholder={"2 lbs chicken\n1/2 cup soy sauce"} value={ingredients} onChange={(e) => setIngredients(e.target.value)} required />
          </div>
          <div className="form-group full-width">
            <label>Instructions (one per line) *</label>
            <textarea rows={4} placeholder={"Heat oil in a pan\nAdd garlic and onions"} value={instructions} onChange={(e) => setInstructions(e.target.value)} required />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Recipe"}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

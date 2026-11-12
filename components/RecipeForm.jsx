"use client";

import { useState } from "react";
import { supabase, uploadImage } from "@/lib/supabase";

const MESSAGE = "Please fill out this field.";
const errorText = { color: "#d93025", fontSize: 12, marginTop: 4, display: "block" };
const errorBorder = { borderColor: "#d93025" };

// recipe is given = edit mode, missing = add mode
export default function RecipeForm({ categories, recipe, onClose, onSaved }) {
  const editing = !!recipe;
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [categoryId, setCategoryId] = useState(recipe?.category_id ? String(recipe.category_id) : "");
  const [cookingTime, setCookingTime] = useState(recipe?.cooking_time ?? "");
  const [servings, setServings] = useState(recipe?.servings ? String(recipe.servings) : "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [ingredients, setIngredients] = useState(recipe?.ingredients ?? "");
  const [instructions, setInstructions] = useState(recipe?.instructions ?? "");
  const [files, setFiles] = useState([null, null, null]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const existing = [recipe?.image ?? null, recipe?.image2 ?? null, recipe?.image3 ?? null];
  const labels = ["Image", "Image 2 (optional)", "Image 3 (optional)"];

  // A field shows its error after the first Add/Save click, and clears once it has text
  const emptyText = (v) => submitted && !v.trim();
  const emptyServings = submitted && (!servings || Number(servings) < 1);
  const emptyCategory = submitted && !categoryId;
  // the first image is required (Image 2 and 3 are optional); when editing, the existing image counts
  const emptyImage = submitted && !files[0] && !existing[0];

  function pickFile(i, file) {
    setFiles((prev) => prev.map((f, idx) => (idx === i ? file : f)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitted(true);

    const invalid =
      !title.trim() ||
      !categoryId ||
      !cookingTime.trim() ||
      !servings ||
      Number(servings) < 1 ||
      !description.trim() ||
      !ingredients.trim() ||
      !instructions.trim() ||
      (!files[0] && !existing[0]);

    if (invalid) {
      // jump to the first field that has an error
      setTimeout(() => {
        document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }

    setSaving(true);
    try {
      const urls = await Promise.all(
        files.map(async (f, i) => (f ? await uploadImage(f) : existing[i]))
      );
      const payload = {
        title: title.trim(),
        category_id: Number(categoryId),
        cooking_time: cookingTime.trim(),
        servings: Number(servings),
        description: description.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        image: urls[0],
        image2: urls[1],
        image3: urls[2],
      };
      const { error } = editing
        ? await supabase.from("recipes").update(payload).eq("id", recipe.id)
        : await supabase.from("recipes").insert(payload);
      if (error) throw error;
      onSaved();
    } catch (err) {
      setError(err?.message ?? "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" style={{ display: "flex", zIndex: 3000 }}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>{editing ? "Edit Recipe" : "Add New Recipe"}</h2>
          <span className="close-modal" onClick={onClose}>&times;</span>
        </div>

        <form className="recipe-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group full-width">
            <label>Recipe Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={emptyText(title) ? errorBorder : undefined}
            />
            {emptyText(title) && <small data-field-error style={errorText}>{MESSAGE}</small>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={emptyCategory ? errorBorder : undefined}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {emptyCategory && <small data-field-error style={errorText}>{MESSAGE}</small>}
            </div>
            <div className="form-group">
              <label>Cooking Time</label>
              <input
                type="text"
                placeholder="e.g., 30 min"
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                style={emptyText(cookingTime) ? errorBorder : undefined}
              />
              {emptyText(cookingTime) && <small data-field-error style={errorText}>{MESSAGE}</small>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Servings</label>
              <input
                type="number"
                min={1}
                placeholder="e.g., 4"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                style={emptyServings ? errorBorder : undefined}
              />
              {emptyServings && <small data-field-error style={errorText}>{MESSAGE}</small>}
            </div>
          </div>

          {labels.map((label, i) => (
            <div className="form-group full-width" key={label}>
              <label>{label}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => pickFile(i, e.target.files?.[0] ?? null)}
                style={i === 0 && emptyImage ? errorBorder : undefined}
              />
              {i === 0 && emptyImage && (
                <small data-field-error style={errorText}>Please choose an image.</small>
              )}
              {files[i] ? (
                <small>New file: {files[i].name}</small>
              ) : existing[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="thumb" src={existing[i]} alt="Current" />
              ) : null}
            </div>
          ))}

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={emptyText(description) ? errorBorder : undefined}
            />
            {emptyText(description) && <small data-field-error style={errorText}>{MESSAGE}</small>}
          </div>

          <div className="form-group full-width">
            <label>Ingredients (one per line)</label>
            <textarea
              rows={4}
              placeholder={"2 lbs chicken\n1/2 cup soy sauce"}
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              style={emptyText(ingredients) ? errorBorder : undefined}
            />
            {emptyText(ingredients) && <small data-field-error style={errorText}>{MESSAGE}</small>}
          </div>

          <div className="form-group full-width">
            <label>Instructions (one per line)</label>
            <textarea
              rows={4}
              placeholder={"Heat oil in a pan\nAdd garlic and onions"}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              style={emptyText(instructions) ? errorBorder : undefined}
            />
            {emptyText(instructions) && <small data-field-error style={errorText}>{MESSAGE}</small>}
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

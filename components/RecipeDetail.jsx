"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const lines = (text) =>
  (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);

export default function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("recipes")
      .select("*, categories(name)")
      .eq("id", Number(id))
      .maybeSingle()
      .then(({ data }) => {
        setRecipe(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (!recipe)
    return (
      <div style={{ padding: 20 }}>
        <p>Recipe not found.</p>
        <Link href="/">← Back to Recipes</Link>
      </div>
    );

  const images = [recipe.image, recipe.image2, recipe.image3].filter(Boolean);

  return (
    <div className="detail-page">
      <div className={images.length > 1 ? "detail-images-grid" : "detail-images-grid single-image"}>
        {images.length === 0 && (
          <div className="detail-img-col">
            <Link href="/" className="back-btn">← Back to Recipes</Link>
          </div>
        )}
        {images.map((src, i) => (
          <div className="detail-img-col" key={src}>
            {i === 0 && <Link href="/" className="back-btn">← Back to Recipes</Link>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={recipe.title} />
          </div>
        ))}
      </div>

      <div className="detail-body">
        <span className="detail-category">{recipe.categories?.name.toUpperCase()}</span>
        <h1 className="detail-title">{recipe.title}</h1>

        <div className="detail-meta">
          {recipe.cooking_time && <span>⏱ <strong>Cooking Time:</strong> {recipe.cooking_time}</span>}
          {recipe.servings && <span>👥 <strong>Servings:</strong> {recipe.servings}</span>}
        </div>

        {recipe.description && <p className="detail-description">{recipe.description}</p>}
        <hr />

        <div className="detail-columns">
          <div className="detail-ingredients">
            <h3>Ingredients</h3>
            <ul>{lines(recipe.ingredients).map((item, i) => <li key={i}>{item}</li>)}</ul>
          </div>
          <div className="detail-instructions">
            <h3>Instructions</h3>
            <ol>{lines(recipe.instructions).map((step, i) => <li key={i}>{step}</li>)}</ol>
          </div>
        </div>
      </div>
    </div>
  );
}

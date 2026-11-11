"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Category, type Recipe } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import RecipeForm from "./RecipeForm";

type Mode = "browse" | "edit" | "delete";

export default function HomeClient() {
  const router = useRouter();
  const { user, profile, isAdmin } = useAuth();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("browse");
  const [form, setForm] = useState<{ recipe?: Recipe } | null>(null);

  const loadRecipes = useCallback(async () => {
    const [r, c] = await Promise.all([
      supabase.from("recipes").select("*, categories(name)").order("id"),
      supabase.from("categories").select("*").order("id"),
    ]);
    if (r.error) setError(r.error.message);
    else setRecipes(r.data as unknown as Recipe[]);
    if (c.data) setCategories(c.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    supabase
      .from("user_favorites")
      .select("recipe_id")
      .eq("user_id", user.id)
      .then(({ data }) => setFavorites((data ?? []).map((f) => f.recipe_id)));
  }, [user]);

  async function toggleFavorite(id: number) {
    if (!user) {
      router.push("/login");
      return;
    }
    if (favorites.includes(id)) {
      setFavorites((f) => f.filter((x) => x !== id));
      await supabase.from("user_favorites").delete().eq("user_id", user.id).eq("recipe_id", id);
    } else {
      setFavorites((f) => [...f, id]);
      await supabase.from("user_favorites").insert({ user_id: user.id, recipe_id: id });
    }
  }

  async function deleteRecipe(r: Recipe) {
    if (!confirm(`Delete "${r.title}"?`)) return;
    const { error } = await supabase.from("recipes").delete().eq("id", r.id);
    if (error) {
      alert(error.message); // e.g. "Cannot delete the last remaining recipe"
      return;
    }
    loadRecipes();
  }

  async function logout() {
    await supabase.auth.signOut();
    setMode("browse");
    router.refresh();
  }

  const visible = recipes.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "All" ||
      (filter === "Favorites" && favorites.includes(r.id)) ||
      r.categories?.name === filter;
    return matchesSearch && matchesFilter;
  });

  const filters = ["All", "Favorites", ...categories.map((c) => c.name)];
  const roleLabel = isAdmin ? "Admin" : user ? "User" : "Guest";

  return (
    <>
      <div className="background" />

      <nav className="navbar" style={{ position: "relative", zIndex: 2000 }}>
        <div className="header">
          <h1 className="Page-title">Kalderong Pinoy</h1>
          <p className="tagline">Discover authentic Filipino dishes</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginRight: 16 }}>
          <div className="user-badge">
            <span className="user-icon">{isAdmin ? "🔐" : "👤"}</span>
            <span className="user-name">{profile?.name ?? "Guest"}</span>
            <span className={`role-tag ${isAdmin ? "admin-tag" : user ? "user-tag" : "guest-tag"}`}>{roleLabel}</span>
          </div>

          {isAdmin && (
            <div className="menu-container">
              <button className="menu-btn" onClick={() => setMenuOpen((o) => !o)}>
                Menu <span className="arrow">{menuOpen ? "▲" : "▼"}</span>
              </button>
              <div className="dropdown-menu" style={{ display: menuOpen ? "block" : "none", zIndex: 2100 }}>
                <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); setForm({}); }}>
                  <span className="icon green">+</span> Add New Recipe
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); setMode("edit"); }}>
                  <span className="icon blue">✏</span> Edit Recipe
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); setMode("delete"); }}>
                  <span className="icon red">✕</span> Delete Recipe
                </a>
              </div>
            </div>
          )}

          {user ? (
            <button className="logout-btn" onClick={logout}>⇠ Logout</button>
          ) : (
            <Link href="/login" className="logout-btn">Login</Link>
          )}
        </div>
      </nav>

      {mode !== "browse" && (
        <div style={{ background: "#e67e22", color: "#fff", textAlign: "center", padding: "10px 16px", fontWeight: 600, position: "relative", zIndex: 1 }}>
          {mode === "edit" ? "✏ Edit Mode — click a recipe card to edit it" : "🗑 Delete Mode — click a recipe card to delete it"}
          <button
            onClick={() => setMode("browse")}
            style={{ background: "#fff", color: "#e67e22", border: "none", borderRadius: 6, padding: "4px 14px", fontWeight: 700, cursor: "pointer", marginLeft: 10 }}
          >
            Exit
          </button>
        </div>
      )}

      <div className="search-box">
        <input type="text" placeholder="Search recipes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="buttons">
          {filters.map((f) => (
            <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {error && <p className="form-error" style={{ textAlign: "center" }}>Error: {error}</p>}
      {loading && <p className="empty-note">Loading recipes...</p>}
      {!loading && !error && recipes.length === 0 && (
        <p className="empty-note">
          No recipes yet.{isAdmin ? " Use Menu → Add New Recipe to add your first one." : ""}
        </p>
      )}
      {!loading && recipes.length > 0 && visible.length === 0 && (
        <p className="empty-note">No recipes found.</p>
      )}

      <div className="recipes">
        {visible.map((r) => (
          <div
            key={r.id}
            className={`card ${mode === "edit" ? "edit-mode-card" : mode === "delete" ? "delete-mode-card" : ""}`}
          >
            <div className="image-container">
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt={r.title} />
              ) : (
                <div style={{ height: 220, background: "#eee" }} />
              )}
              <button
                className={`favorite-btn ${favorites.includes(r.id) ? "active-heart" : ""}`}
                onClick={() => toggleFavorite(r.id)}
                aria-label="Toggle favorite"
              >
                &#9829;
              </button>
            </div>

            <div className="card-content">
              <div className="category">{r.categories?.name}</div>
              <div className="title">{r.title}</div>
              <div className="info">
                <span>⏰ {r.cooking_time}</span>
                <span>👥 {r.servings} servings</span>
              </div>
            </div>

            {mode === "browse" ? (
              <Link href={`/recipe/${r.id}`} className="card-main-link" aria-label={`View ${r.title}`} />
            ) : (
              <button
                className="card-main-link"
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
                aria-label={mode === "edit" ? `Edit ${r.title}` : `Delete ${r.title}`}
                onClick={() => (mode === "edit" ? setForm({ recipe: r }) : deleteRecipe(r))}
              />
            )}
          </div>
        ))}
      </div>

      {form && (
        <RecipeForm
          categories={categories}
          recipe={form.recipe}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            setMode("browse");
            loadRecipes();
          }}
        />
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register" | "guest";

const icon = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const UserIcon = () => (
  <svg {...icon}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
);
const MailIcon = () => (
  <svg {...icon}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
const LockIcon = () => (
  <svg {...icon}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
);
const EyeIcon = () => (
  <svg {...icon}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon = () => (
  <svg {...icon}><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setInfo("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setShowPassword(false);
    setShowConfirm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push("/");
    } else {
      if (password !== confirm) {
        setError("Passwords do not match.");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) setError(error.message);
        else if (data.session) router.push("/");
        else setInfo("Account created! Check your email to confirm, then sign in.");
      }
    }
    setBusy(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-icon">🍲</div>
        <h1 className="brand-title">Kalderong Pinoy</h1>
        <p className="brand-sub">Authentic Filipino Recipes</p>

        <div className="login-tabs">
          <button
            type="button"
            className={mode === "login" || mode === "register" ? "active" : ""}
            onClick={() => switchMode("login")}
          >
            <span>🔑</span> Login
          </button>
          <button
            type="button"
            className={mode === "guest" ? "active" : ""}
            onClick={() => switchMode("guest")}
          >
            <span>🥘</span> Guest
          </button>
        </div>

        {mode === "guest" ? (
          <div className="guest-panel">
            <div className="guest-icon">🥘</div>
            <h2>Browse as Guest</h2>
            <p className="guest-desc">
              Explore our collection of authentic Filipino recipes without an account.
            </p>
            <ul className="guest-features">
              <li>✅ Browse all recipes</li>
              <li>✅ View recipe details</li>
              <li>✅ Search and filter</li>
              <li>❌ Save favorites</li>
            </ul>
            <button type="button" className="guest-btn" onClick={() => router.push("/")}>
              Continue as Guest
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <label className="field-label">Name</label>
                <div className="input-wrap">
                  <span className="input-icon"><UserIcon /></span>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    autoComplete="off"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <label className="field-label">Email</label>
            <div className="input-wrap">
              <span className="input-icon"><MailIcon /></span>
              <input
                type="email"
                placeholder="Enter your email"
                autoComplete={mode === "login" ? "email" : "off"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <label className="field-label">Password</label>
            <div className="input-wrap">
              <span className="input-icon"><LockIcon /></span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>

            {mode === "register" && (
              <>
                <label className="field-label">Confirm Password</label>
                <div className="input-wrap">
                  <span className="input-icon"><LockIcon /></span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </>
            )}

            {error && <p className="form-error">{error}</p>}
            {info && <p className="form-info">{info}</p>}

            <button type="submit" className="signin-btn" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>

            <p className="switch-text">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button type="button" onClick={() => switchMode("register")}>Register here</button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => switchMode("login")}>Sign in</button>
                </>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Profile = { name: string; role: "admin" | "user" };

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load(u: User | null) {
      if (!u) {
        if (!active) return;
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", u.id)
        .maybeSingle();
      if (!active) return;
      setUser(u);
      setProfile((data as Profile | null) ?? null);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // setTimeout avoids calling Supabase inside its own auth callback
      setTimeout(() => load(session?.user ?? null), 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading, isAdmin: profile?.role === "admin" };
}

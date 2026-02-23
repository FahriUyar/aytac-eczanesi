import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const resolved = useRef(false);

  useEffect(() => {
    let mounted = true;

    const finish = (sessionUser = null) => {
      if (mounted && !resolved.current) {
        resolved.current = true;
        setUser(sessionUser);
        setLoading(false);
      }
    };

    // Timeout: Supabase bağlantısı yoksa uygulamayı asılı bırakma
    const timeout = setTimeout(() => {
      if (!resolved.current) {
        console.warn(
          "Supabase bağlantı zaman aşımı — giriş sayfası gösteriliyor.",
        );
        finish(null);
      }
    }, 3000);

    let subscription = null;

    try {
      // Mevcut oturumu kontrol et
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          finish(session?.user ?? null);
        })
        .catch((err) => {
          console.error("Oturum kontrolü hatası:", err);
          finish(null);
        });

      // Auth durumu değişikliklerini dinle
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
          resolved.current = true;
        }
      });
      subscription = data.subscription;
    } catch (err) {
      console.error("Supabase başlatma hatası:", err);
      finish(null);
    }

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

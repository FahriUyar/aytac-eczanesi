/**
 * useProfile Hook + ProfileProvider
 *
 * Neden bu Context?
 * Kullanıcının `profiles` tablosundaki app_name bilgisini
 * her sayfada ayrı ayrı DB'den çekmek yerine, giriş anında
 * bir kez okuyup Context'e koyuyoruz. Böylece Header ve
 * diğer bileşenler doğrudan bellek içi state'i kullanır.
 *
 * needsOnboarding = true → kullanıcı henüz isim vermemiş,
 * OnboardingForm gösterilir.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

const ProfileContext = createContext({});

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [appName, setAppName] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Giriş anında profili çek
  useEffect(() => {
    if (!user) {
      setAppName(null);
      setProfileLoading(false);
      setNeedsOnboarding(false);
      return;
    }

    let mounted = true;

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("app_name")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.error("Profil yükleme hatası:", error);
          // Hata olsa bile onboarding göster — kullanıcı yine isim girebilir
          setNeedsOnboarding(true);
        } else if (!data || !data.app_name) {
          // Profil yok veya app_name boş → onboarding gerekli
          setNeedsOnboarding(true);
        } else {
          setAppName(data.app_name);
          setNeedsOnboarding(false);
        }
      } catch (err) {
        console.error("Profil çekme hatası:", err);
        if (mounted) setNeedsOnboarding(true);
      } finally {
        if (mounted) setProfileLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  /**
   * Kullanıcının uygulama ismini kaydeder (upsert).
   * Neden upsert? İlk kayıtta INSERT, sonraki güncellemelerde UPDATE yapar.
   * profiles tablosunda id zaten PK olduğu için conflict detection otomatik.
   */
  const saveAppName = useCallback(
    async (name) => {
      if (!user) return;

      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          app_name: name.trim(),
        },
        { onConflict: "id" },
      );

      if (error) throw error;

      setAppName(name.trim());
      setNeedsOnboarding(false);
    },
    [user],
  );

  return (
    <ProfileContext.Provider
      value={{ appName, profileLoading, needsOnboarding, saveAppName }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}

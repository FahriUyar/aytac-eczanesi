import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { Loader2 } from "lucide-react";
import OnboardingForm from "./OnboardingForm";

/**
 * PrivateRoute
 *
 * Neden burada onboarding kontrolü?
 * Kullanıcı giriş yaptıktan sonra ana uygulamayı görmeden önce
 * profil kontrolü yapılır. Eğer profiles tablosunda kayıt yoksa
 * veya app_name boşsa, OnboardingForm gösterilir.
 * Böylece tüm sayfalar otomatik olarak korunmuş olur.
 */
export default function PrivateRoute() {
  const { user, loading } = useAuth();
  const { profileLoading, needsOnboarding } = useProfile();

  // Auth yükleniyor
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-text-secondary text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Giriş yapmamış
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Profil yükleniyor
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-text-secondary text-sm">
            Profil kontrol ediliyor...
          </p>
        </div>
      </div>
    );
  }

  // Onboarding gerekli — app_name henüz girilmemiş
  if (needsOnboarding) {
    return <OnboardingForm />;
  }

  return <Outlet />;
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";

/**
 * Modern FinTech SaaS Login/Register Component
 * Split screen layout:
 * - Left: Brand & Trust (Dark blue bg)
 * - Right: Form area (White bg, modern inputs)
 */

const INVITE_CODE = "BİLANÇO_TAKİP_2026";

export default function Login() {
  const [activeTab, setActiveTab] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setReferralCode("");
    setError("");
    setSuccess("");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "E-posta veya şifre hatalı."
          : err.message?.includes("Email not confirmed")
            ? "E-posta adresiniz henüz doğrulanmamış. Supabase panelinden kullanıcıyı onaylayın."
            : `Giriş hatası: ${err.message || "Bilinmeyen hata. Lütfen tekrar deneyin."}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (referralCode.trim() !== INVITE_CODE) {
      setError("Geçersiz Davet Kodu. Lütfen size verilen kodu girin.");
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password);
      setSuccess("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz.");
      setTimeout(() => {
        setActiveTab("login");
        setSuccess("");
        setEmail("");
        setPassword("");
        setReferralCode("");
      }, 3000);
    } catch (err) {
      setError(
        err.message ||
          "Kayıt yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isLogin = activeTab === "login";

  return (
    <div className="h-screen w-full grid md:grid-cols-2 bg-white selection:bg-blue-100 selection:text-blue-900">
      
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANE (Brand & Trust / Dark Blue)
      ────────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col justify-center items-center bg-slate-900 relative overflow-hidden p-12 text-center">
        {/* Decorative background glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo Context (Optional, can be replaced with real logo) */}
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-900/50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            Finansal geleceğinizi <br /> tasarlayın.
          </h1>
          
          <p className="text-slate-300 text-lg mb-12 max-w-sm">
            Bilanço Takip ile gelir ve giderlerinizi profesyonel bir SaaS deneyimiyle yönetin.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 font-medium">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Verileriniz modern şifreleme standartlarıyla korunmaktadır.</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANE (Form Area / Pure White)
      ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-center items-center bg-white p-6 sm:p-12 relative overflow-y-auto">
        
        {/* Mobile Header (Visible only on small screens) */}
        <div className="md:hidden flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Bilanço Takip</h2>
        </div>

        <div className="w-full max-w-sm animate-fade-in">
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
              {isLogin ? "Tekrar Hoş Geldiniz" : "Hesap Oluşturun"}
            </h2>
            <p className="text-sm text-gray-500">
              {isLogin ? "Hesabınıza erişmek için bilgilerinizi girin." : "Finansal kontrolünüzü elinize almak için hemen başlayın."}
            </p>
          </div>

          {/* Tab Selection Navigation */}
          <div className="flex mb-8 bg-gray-100/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleTabChange("login")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                isLogin
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("register")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                !isLogin
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {/* Form Messages */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-posta Adresi
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@sirketiniz.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Şifre
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Davet Kodu — sadece Kayıt Ol modunda */}
            {!isLogin && (
              <div className="space-y-1.5 animate-fade-in pb-2">
                <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700">
                  Davet Kodu (Şirket/Kurum Kodu)
                </label>
                <input
                  id="referralCode"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Opsiyonel referans / erişim kodu"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all duration-200 shadow-md shadow-slate-900/10 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Lütfen Bekleyin...
                </>
              ) : isLogin ? (
                "Sisteme Giriş Yap"
              ) : (
                "Hemen Kayıt Ol"
              )}
            </button>
          </form>



        </div>
      </div>
    </div>
  );
}

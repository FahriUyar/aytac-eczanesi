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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Şifre
                </label>
                {isLogin && (
                  <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Şifremi unuttum</a>
                )}
              </div>
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

          {/* ─────────────────────────────────────────────────────────────
              OAUTH DIVIDER & BUTTONS
          ────────────────────────────────────────────────────────────── */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500 font-medium">Veya şununla devam et</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors text-gray-700 font-medium text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors text-gray-700 font-medium text-sm"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                Github
              </button>
            </div>
          </div>
          {/* End OAuth */}

        </div>
      </div>
    </div>
  );
}

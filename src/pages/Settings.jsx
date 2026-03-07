import { useState, useEffect } from "react";
import { useProfile } from "../hooks/useProfile";
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  Check,
  CalendarDays,
  Type,
  Building2,
  Wallet,
} from "lucide-react";
import Card from "../components/ui/Card";

/**
 * Settings (Ayarlar) Sayfası
 *
 * Neden bu sayfa?
 * Kullanıcının onboarding'de girdiği app_name ve salary_day
 * bilgilerini sonradan değiştirebilmesi gerekiyor.
 * ProfileContext'ten mevcut değerleri çeker, formda gösterir,
 * güncelleme sonrası Context'i de günceller.
 */

export default function Settings() {
  const { appName, salaryDay, accountType, saveProfile } = useProfile();

  const [formName, setFormName] = useState("");
  const [formSalaryDay, setFormSalaryDay] = useState(1);
  const [formAccountType, setFormAccountType] = useState("personal");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Mevcut profil verilerini form'a doldur
  useEffect(() => {
    if (appName) setFormName(appName);
    if (salaryDay) setFormSalaryDay(salaryDay);
    if (accountType) setFormAccountType(accountType);
  }, [appName, salaryDay, accountType]);

  const handleSalaryDayChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      setFormSalaryDay("");
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 31) {
      setFormSalaryDay(num);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      await saveProfile({
        appName: formName,
        salaryDay: Number(formSalaryDay) || 1,
        accountType: formAccountType,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Ayarlar güncelleme hatası:", err);
      setError("Güncelleme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-primary-600" />
          Ayarlar
        </h1>
        <p className="text-text-secondary mt-1">
          Uygulama ismi ve bütçe döngüsü tercihlerinizi yönetin.
        </p>
      </div>

      {/* Success Toast */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-success-50 border border-success-500/20 text-success-700 text-sm font-medium animate-fade-in">
          <Check className="w-4 h-4" />
          Ayarlar başarıyla güncellendi!
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-danger-50 border border-danger-500/20 text-danger-700 text-sm animate-fade-in">
          {error}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Uygulama İsmi */}
          <div className="space-y-2">
            <label
              htmlFor="settingsAppName"
              className="flex items-center gap-2 text-sm font-medium text-text-primary"
            >
              <Type className="w-4 h-4 text-primary-500" />
              Uygulama İsmi
            </label>
            <input
              id="settingsAppName"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Örn: Ev Bütçem, Eczane Bilançosu"
              required
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            />
            <p className="text-xs text-text-muted">
              Sidebar ve Header'da görüntülenecek isim.
            </p>
          </div>

          {/* Maaş Günü */}
          <div className="space-y-2">
            <label
              htmlFor="settingsSalaryDay"
              className="flex items-center gap-2 text-sm font-medium text-text-primary"
            >
              <CalendarDays className="w-4 h-4 text-primary-500" />
              Bütçe Başlangıç / Maaş Günü
            </label>
            <input
              id="settingsSalaryDay"
              type="number"
              min={1}
              max={31}
              value={formSalaryDay}
              onChange={handleSalaryDayChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            />
            <p className="text-xs text-text-muted">
              Dashboard'daki dönem hesabı bu güne göre yapılır. (1 = ayın başı,
              15 = ayın ortası, vb.)
            </p>
          </div>

          {/* Hesap Türü */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Wallet className="w-4 h-4 text-primary-500" />
              Hesap Türü / Görünüm Modu
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bireysel Option */}
              <label
                className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all ${
                  formAccountType === "personal"
                    ? "border-primary-500 bg-primary-50"
                    : "border-border bg-white hover:border-primary-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold ${formAccountType === "personal" ? "text-primary-700" : "text-text-primary"}`}>
                    Bireysel
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formAccountType === "personal" ? "border-primary-500" : "border-gray-300"}`}>
                    {formAccountType === "personal" && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Nakit ve kredi kartı borcunuzu ayrı ayrı takip edin.
                </p>
                <input
                  type="radio"
                  name="accountType"
                  value="personal"
                  checked={formAccountType === "personal"}
                  onChange={(e) => setFormAccountType(e.target.value)}
                  className="sr-only"
                />
              </label>

              {/* İşletme Option */}
              <label
                className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all ${
                  formAccountType === "business"
                    ? "border-primary-500 bg-primary-50"
                    : "border-border bg-white hover:border-primary-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold ${formAccountType === "business" ? "text-primary-700" : "text-text-primary"}`}>
                    İşletme
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formAccountType === "business" ? "border-primary-500" : "border-gray-300"}`}>
                    {formAccountType === "business" && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Sadece toplam gelir ve giderlerinizi içeren sade görünüm.
                </p>
                <input
                  type="radio"
                  name="accountType"
                  value="business"
                  checked={formAccountType === "business"}
                  onChange={(e) => setFormAccountType(e.target.value)}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Kaydet */}
          <button
            type="submit"
            disabled={saving || !formName.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Güncelleniyor...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Güncelle
              </>
            )}
          </button>
        </form>
      </Card>
    </div>
  );
}

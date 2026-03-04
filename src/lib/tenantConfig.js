/**
 * Tenant Configuration
 *
 * Neden bu dosya? Tek kod tabanı, birden fazla domain.
 * window.location.hostname'i okuyarak hangi "kiracı" için
 * çalıştığımızı anlıyoruz ve ona özgü marka bilgilerini döndürüyoruz.
 *
 * Güncelleme: Eczaneye özgü yeşil renk paleti kaldırıldı.
 * Artık varsayılan tema nötr lacivert/kurumsal bir palet.
 * Kullanıcının kişisel app_name bilgisi profiles tablosundan
 * (useProfile hook aracılığıyla) geliyor — buradaki appName
 * sadece profil yüklenene kadarki fallback.
 */

import { BarChart3, Home } from "lucide-react";

const TENANTS = {
  // Varsayılan — nötr kurumsal lacivert palet
  default: {
    key: "default",
    appName: "Bilanço Takip",
    subtitle: "Finansal Yönetim",
    Icon: BarChart3,
    colors: {
      "--color-primary-50": "#eff6ff",
      "--color-primary-100": "#dbeafe",
      "--color-primary-200": "#bfdbfe",
      "--color-primary-300": "#93c5fd",
      "--color-primary-400": "#60a5fa",
      "--color-primary-500": "#3b82f6",
      "--color-primary-600": "#2563eb",
      "--color-primary-700": "#1d4ed8",
      "--color-primary-800": "#1e40af",
      "--color-primary-900": "#1e3a8a",
      "--color-sidebar": "#1e293b",
    },
  },

  ev: {
    key: "ev",
    appName: "Ev Bütçesi",
    subtitle: "Aile Finansı",
    Icon: Home,
    // Sıcak kiremit / mor paleti
    colors: {
      "--color-primary-50": "#fdf4ff",
      "--color-primary-100": "#fae8ff",
      "--color-primary-200": "#f5d0fe",
      "--color-primary-300": "#e879f9",
      "--color-primary-400": "#d946ef",
      "--color-primary-500": "#a855f7",
      "--color-primary-600": "#9333ea",
      "--color-primary-700": "#7e22ce",
      "--color-primary-800": "#6b21a8",
      "--color-primary-900": "#581c87",
      "--color-sidebar": "#2e1065",
    },
  },
};

/**
 * Hostname'e göre doğru tenant config'i döndürür.
 * localhost'ta test ederken domain içerip içermediğine bakar,
 * varsayılan olarak nötr (default) döner.
 */
export function getTenantConfig() {
  const host = window.location.hostname;

  if (host.includes("cansu-fahri") || host.includes("ev-butcesi")) {
    return TENANTS.ev;
  }

  // aytac-eczanesi.vercel.app, localhost ve diğerleri → varsayılan nötr tema
  return TENANTS.default;
}

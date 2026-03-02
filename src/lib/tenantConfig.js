/**
 * Tenant Configuration
 *
 * Neden bu dosya? Tek kod tabanı, birden fazla domain.
 * window.location.hostname'i okuyarak hangi "kiracı" için
 * çalıştığımızı anlıyoruz ve ona özgü marka bilgilerini döndürüyoruz.
 */

import { Pill, Home } from "lucide-react";

const TENANTS = {
  eczane: {
    key: "eczane",
    appName: "Aytaç Eczanesi",
    subtitle: "Eczane Yönetimi",
    Icon: Pill,
    // Mavi-Yeşil sağlık paleti
    colors: {
      "--color-primary-50": "#ecfdf5",
      "--color-primary-100": "#d1fae5",
      "--color-primary-200": "#a7f3d0",
      "--color-primary-300": "#6ee7b7",
      "--color-primary-400": "#34d399",
      "--color-primary-500": "#10b981",
      "--color-primary-600": "#059669",
      "--color-primary-700": "#047857",
      "--color-primary-800": "#065f46",
      "--color-primary-900": "#064e3b",
      "--color-sidebar": "#064e3b",
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
      "--color-primary-300": "#e879f9", // daha canlı
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
 * varsayılan olarak eczane döner.
 */
export function getTenantConfig() {
  const host = window.location.hostname;

  if (host.includes("cansu-fahri") || host.includes("ev-butcesi")) {
    return TENANTS.ev;
  }

  // aytac-eczanesi.vercel.app, localhost ve diğerleri → eczane
  return TENANTS.eczane;
}

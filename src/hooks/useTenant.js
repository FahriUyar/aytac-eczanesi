/**
 * useTenant Hook
 *
 * Neden bu hook? Branding bilgisini tek yerden tüm bileşenlere dağıtmak için.
 * Ayrıca CSS custom properties'i runtime'da günceller — böylece TailwindCSS
 * sınıfları (primary-600, primary-500 vb.) otomatik olarak doğru rengi gösterir.
 * Bileşenlerin her birini ayrı ayrı değiştirmek zorunda kalmayız.
 */

import { useEffect, useMemo } from "react";
import { getTenantConfig } from "../lib/tenantConfig";

export function useTenant() {
  // Tenant config'i bir kez hesapla, bileşen ömrü boyunca sabit kalır.
  const tenant = useMemo(() => getTenantConfig(), []);

  useEffect(() => {
    // CSS custom properties'i root element'e yaz.
    // Tailwind 4'te @theme içindeki değişkenler bu property'leri kullanır.
    const root = document.documentElement;
    Object.entries(tenant.colors).forEach(([prop, value]) => {
      root.style.setProperty(prop, value);
    });

    // Tarayıcı sekmesi başlığını da güncelle
    document.title = tenant.appName;
  }, [tenant]);

  return tenant;
}

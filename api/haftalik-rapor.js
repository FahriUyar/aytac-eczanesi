import { createClient } from "@supabase/supabase-js";

/**
 * Vercel Serverless Function — GET /api/haftalik-rapor
 *
 * Son 7 günün harcamalarını toplayıp kategorilere göre özetler.
 * n8n bu endpoint'i okuyarak haftalık rapor oluşturabilir.
 *
 * Örnek Yanıt:
 *   {
 *     "toplam_harcama": 15000,
 *     "kategoriler": { "Market": 2000, "Fatura": 1000, "Diğer": 12000 }
 *   }
 *
 * Gerekli Header:
 *   x-api-key: <API_SECRET_KEY>
 */

// ── Supabase istemcisi (sunucu tarafı — service_role key ile RLS bypass) ──
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // ── 1. Sadece GET kabul et ──
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Yalnızca GET istekleri kabul edilir" });
  }

  // ── 2. API Key kontrolü (Güvenlik Kilidi) ──
  const apiKey = req.headers["x-api-key"];
  const expectedKey = process.env.API_SECRET_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: "Yetkisiz erişim" });
  }

  // ── 3. Kullanıcı ID ──
  const userId = process.env.DEFAULT_USER_ID;
  if (!userId) {
    console.error("DEFAULT_USER_ID environment variable tanımlı değil");
    return res.status(500).json({ error: "Sunucu yapılandırma hatası" });
  }

  // ── 4. Son 7 günün tarih aralığını hesapla ──
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  // YYYY-MM-DD formatına çevir
  const startDate = sevenDaysAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  // ── 5. Supabase'ten son 7 günün giderlerini çek ──
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, categories(name)")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("Supabase sorgu hatası:", error);
    return res.status(500).json({
      error: "Veritabanı sorgusu sırasında hata oluştu",
      detail: error.message,
    });
  }

  // ── 6. Toplam ve kategori bazlı hesaplama ──
  let toplamHarcama = 0;
  const kategoriler = {};

  for (const tx of data || []) {
    const amount = Number(tx.amount);
    const categoryName = tx.categories?.name || "Kategorisiz";

    toplamHarcama += amount;
    kategoriler[categoryName] = (kategoriler[categoryName] || 0) + amount;
  }

  // ── 7. Temiz JSON yanıt ──
  return res.status(200).json({
    toplam_harcama: Math.round(toplamHarcama * 100) / 100,
    kategoriler,
    donem: {
      baslangic: startDate,
      bitis: endDate,
    },
  });
}

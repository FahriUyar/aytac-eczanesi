import { createClient } from "@supabase/supabase-js";

/**
 * Vercel Serverless Function — GET /api/haftalik-rapor
 *
 * Telegram Chat ID'si kayıtlı tüm aktif kullanıcılar için
 * son 7 günün harcamalarını toplayıp kategorilere göre özetler.
 * n8n bu diziyi alıp her kullanıcıya ayrı ayrı Telegram mesajı gönderir.
 *
 * Örnek Yanıt:
 *   [
 *     {
 *       "kullanici_id": "uuid-1",
 *       "telegram_chat_id": "1215535881",
 *       "rapor": {
 *         "toplam_harcama": 15000,
 *         "kategoriler": { "Market": 2000, "Fatura": 1000 },
 *         "donem": { "baslangic": "2026-03-08", "bitis": "2026-03-15" }
 *       }
 *     }
 *   ]
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

  // ── 3. Telegram Chat ID'si olan tüm aktif kullanıcıları çek ──
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id, telegram_chat_id")
    .not("telegram_chat_id", "is", null)
    .neq("telegram_chat_id", "");

  if (usersError) {
    console.error("Kullanıcı listesi çekilemedi:", usersError);
    return res.status(500).json({
      error: "Kullanıcılar sorgulanırken hata oluştu",
      detail: usersError.message,
    });
  }

  if (!users || users.length === 0) {
    return res.status(200).json([]);
  }

  // ── 4. Son 7 günün tarih aralığını hesapla ──
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const startDate = sevenDaysAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  // ── 5. Her kullanıcı için rapor oluştur ──
  const raporlar = [];

  for (const user of users) {
    // Bu kullanıcının son 7 günlük giderlerini çek
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("amount, categories(name)")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("date", startDate)
      .lte("date", endDate);

    if (txError) {
      console.error(`Kullanıcı ${user.id} için sorgu hatası:`, txError);
      continue; // Hatalı kullanıcıyı atla, diğerlerine devam et
    }

    // Toplam ve kategori bazlı hesaplama
    let toplamHarcama = 0;
    const kategoriler = {};

    for (const tx of transactions || []) {
      const amount = Number(tx.amount);
      const categoryName = tx.categories?.name || "Kategorisiz";

      toplamHarcama += amount;
      kategoriler[categoryName] = (kategoriler[categoryName] || 0) + amount;
    }

    raporlar.push({
      kullanici_id: user.id,
      telegram_chat_id: user.telegram_chat_id,
      rapor: {
        toplam_harcama: Math.round(toplamHarcama * 100) / 100,
        kategoriler,
        donem: {
          baslangic: startDate,
          bitis: endDate,
        },
      },
    });
  }

  // ── 6. Temiz JSON dizisi döndür ──
  return res.status(200).json(raporlar);
}

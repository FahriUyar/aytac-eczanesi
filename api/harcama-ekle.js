import { createClient } from "@supabase/supabase-js";

/**
 * Vercel Serverless Function — POST /api/harcama-ekle
 *
 * n8n'den gelen harcama verisini doğrular ve Supabase'e kaydeder.
 *
 * Beklenen Body:
 *   { "tutar": 99.00, "tarih": "27.09.2014", "kategori": "Diğer" }
 *
 * Gerekli Header:
 *   x-api-key: <API_SECRET_KEY>
 */

// ── Supabase istemcisi (sunucu tarafı — service_role key ile RLS bypass) ──
// Anon key kullanırsak RLS "giriş yapmış kullanıcı" arar ve engeller.
// Service role key sunucu tarafında güvenle kullanılabilir.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Tarih formatı çevirici: "27.09.2014" → "2014-09-27"
 * Supabase DATE sütunu ISO formatı bekler.
 */
function convertDate(ddmmyyyy) {
  const parts = ddmmyyyy.split(".");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  // Temel doğrulama
  if (!day || !month || !year) return null;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export default async function handler(req, res) {
  // ── 1. Sadece POST kabul et ──
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Yalnızca POST istekleri kabul edilir" });
  }

  // ── 2. API Key kontrolü (Güvenlik Kilidi) ──
  const apiKey = req.headers["x-api-key"];
  const expectedKey = process.env.API_SECRET_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: "Yetkisiz erişim" });
  }

  // ── 3. Body'yi oku ve doğrula ──
  const { tutar, tarih, kategori } = req.body;

  if (tutar === undefined || tutar === null) {
    return res.status(400).json({ error: "Tutar alanı zorunludur" });
  }
  if (!tarih) {
    return res.status(400).json({ error: "Tarih alanı zorunludur" });
  }

  // ── 4. Tarih dönüşümü (GG.AA.YYYY → YYYY-MM-DD) ──
  const isoDate = convertDate(tarih);
  if (!isoDate) {
    return res.status(400).json({
      error: "Geçersiz tarih formatı. Beklenen: GG.AA.YYYY (örn: 27.09.2014)",
    });
  }

  // ── 5. Kullanıcı ID ──
  const userId = process.env.DEFAULT_USER_ID;
  if (!userId) {
    console.error("DEFAULT_USER_ID environment variable tanımlı değil");
    return res.status(500).json({ error: "Sunucu yapılandırma hatası" });
  }

  // ── 6. Kategori eşleştirme (isimden ID'ye) ──
  let categoryId = null;

  if (kategori) {
    const { data: catData } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", kategori)
      .limit(1)
      .single();

    if (catData) {
      categoryId = catData.id;
    }
    // Kategori bulunamazsa null olarak devam eder — kayıp veri olmaz
  }

  // ── 7. Supabase'e kaydet ──
  const { data, error } = await supabase.from("transactions").insert({
    user_id: userId,
    date: isoDate,
    amount: Number(tutar),
    type: "expense",
    category_id: categoryId,
    description: kategori ? `[n8n] ${kategori}` : "[n8n] Otomatik kayıt",
    payment_method: "cash",
  }).select();

  if (error) {
    console.error("Supabase insert hatası:", error);
    return res.status(500).json({
      error: "Veritabanına kayıt sırasında hata oluştu",
      detail: error.message,
    });
  }

  // ── 8. Başarılı yanıt ──
  return res.status(200).json({
    success: true,
    message: "Kayıt Başarılı",
    id: data?.[0]?.id || null,
  });
}

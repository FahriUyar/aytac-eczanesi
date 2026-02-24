/**
 * İşlemleri Google E-Tablolar'a aktarır.
 * Verileri HTML tablo formatında panoya kopyalar ve
 * yeni bir Google Sheets tablosu açar. Kullanıcı Ctrl+V ile yapıştırabilir.
 *
 * Alternatif olarak: CSV olarak da indirebilir.
 */
export function exportTransactionsToGoogleSheets(
  transactions,
  monthName,
  year,
) {
  // Başlık satırı
  const headers = ["Tarih", "Tür", "Kategori", "Açıklama", "Tutar (₺)"];

  // Veri satırları
  const rows = transactions.map((tx) => {
    const date = new Date(tx.date).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const type = tx.type === "income" ? "Gelir" : "Gider";
    const category = tx.categories?.name || "—";
    const description = tx.description || "—";
    const amount = Number(tx.amount).toFixed(2);

    return [date, type, category, description, amount];
  });

  // Toplam hesaplamaları
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const net = totalIncome - totalExpense;

  // Boş satır + özet satırları
  const summaryRows = [
    [], // boş satır
    ["", "", "", "Toplam Gelir", totalIncome.toFixed(2)],
    ["", "", "", "Toplam Gider", totalExpense.toFixed(2)],
    ["", "", "", "Net Durum", net.toFixed(2)],
  ];

  const allRows = [headers, ...rows, ...summaryRows];

  // TSV (Tab Separated Values) oluştur — Google Sheets yapıştırma için en iyi format
  const tsvContent = allRows
    .map((row) => row.map((cell) => String(cell ?? "")).join("\t"))
    .join("\n");

  // HTML tablo formatı (daha zengin yapıştırma deneyimi)
  const htmlTable = `<table>
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
      <tr><td colspan="5"></td></tr>
      <tr><td></td><td></td><td></td><td><strong>Toplam Gelir</strong></td><td>${totalIncome.toFixed(2)}</td></tr>
      <tr><td></td><td></td><td></td><td><strong>Toplam Gider</strong></td><td>${totalExpense.toFixed(2)}</td></tr>
      <tr><td></td><td></td><td></td><td><strong>Net Durum</strong></td><td>${net.toFixed(2)}</td></tr>
    </tbody>
  </table>`;

  // Panoya hem TSV hem HTML olarak kopyala
  const clipboardItem = new ClipboardItem({
    "text/plain": new Blob([tsvContent], { type: "text/plain" }),
    "text/html": new Blob([htmlTable], { type: "text/html" }),
  });

  return navigator.clipboard.write([clipboardItem]).then(() => {
    // Yeni Google Sheets tablosu aç
    window.open("https://sheets.google.com/create", "_blank");
    return true;
  });
}

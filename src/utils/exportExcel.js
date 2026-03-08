import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

/**
 * İşlemleri Excel dosyasına (XLSX) aktarır.
 * ExcelJS kullanılarak daha profesyonel bir UI, çoklu sekme (İşlem Geçmişi, Rapor Özeti)
 * ve özel sütun biçimlendirmeleri (kalın, arkaplan, para birimi) sağlar.
 */
export async function exportTransactionsToExcel(
  transactions,
  monthName,
  year,
  appName = "Rapor",
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = appName;
  workbook.created = new Date();

  // ─────────────────────────────────────────────────────────────────
  // SEKME 1: İşlem Geçmişi
  // ─────────────────────────────────────────────────────────────────
  const historySheet = workbook.addWorksheet("İşlem Geçmişi");

  // Sütun yapılandırması
  historySheet.columns = [
    { header: "Tarih", key: "date", width: 15 },
    { header: "Tür", key: "type", width: 10 },
    { header: "Kategori", key: "category", width: 25 },
    { header: "Açıklama", key: "description", width: 35 },
    { header: "Tutar", key: "amount", width: 15 },
  ];

  // Başlık (Header) satırı stili
  const headerRow = historySheet.getRow(1);
  headerRow.font = { name: "Arial", size: 12, bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" }, 
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // İşlem verilerini ekleme
  transactions.forEach((tx) => {
    const dateStr = new Date(tx.date).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const typeLabel = tx.type === "income" ? "Gelir" : "Gider";
    const catLabel = tx.categories?.name || "—";
    const desc = tx.description || "—";
    const amountVal = Number(tx.amount);

    const row = historySheet.addRow({
      date: dateStr,
      type: typeLabel,
      category: catLabel,
      description: desc,
      amount: amountVal,
    });

    // Tutar hücresi TL formatı (Sütun 5)
    row.getCell(5).numFmt = '#,##0.00" ₺"';
  });

  // ─────────────────────────────────────────────────────────────────
  // DEĞERLERİ HESAPLA (Rapor Özeti için)
  // ─────────────────────────────────────────────────────────────────
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = {};

  transactions.forEach((tx) => {
    const amountVal = Number(tx.amount);
    if (tx.type === "income") {
      totalIncome += amountVal;
    } else if (tx.type === "expense") {
      // Sadece giderleri kategorilere göre grupla (is_transfer hariç diyebiliriz ama
      // basitlik adına gelen tüm işlemleri sayıyoruz, kullanıcı isteğine göre genişletilebilir)
      if (!tx.is_transfer) {
        totalExpense += amountVal;
        
        let parentId;
        let parentName;
        if (tx.categories) {
          if (tx.categories.parent_id) {
            parentId = tx.categories.parent_id;
            parentName = "Alt Kategori (Ana kategori hesaplanmalı)"; 
            // Eğer elimizde tüm kategoriler listesi yoksa elimizdeki veriye göre gruplarız
            parentName = tx.categories.name; 
          } else {
            parentId = tx.categories.id;
            parentName = tx.categories.name;
          }
        } else {
          parentId = "uncategorized";
          parentName = "Kategorisiz";
        }
        
        if (!categoryTotals[parentId]) {
          categoryTotals[parentId] = { name: parentName, total: 0 };
        }
        categoryTotals[parentId].total += amountVal;
      }
    }
  });

  const net = totalIncome - totalExpense;

  // ─────────────────────────────────────────────────────────────────
  // SEKME 2: Rapor Özeti
  // ─────────────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet("Rapor Özeti");

  summarySheet.columns = [
    { header: "Özet Kalemi", key: "item", width: 25 },
    { header: "Tutar", key: "amount", width: 20 },
  ];

  const summaryHeader = summarySheet.getRow(1);
  summaryHeader.font = { name: "Arial", size: 12, bold: true };
  summaryHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  summaryHeader.alignment = { vertical: "middle", horizontal: "left" };

  // Ana Toplamlar
  summarySheet.addRow({ item: "Toplam Gelir", amount: totalIncome });
  summarySheet.addRow({ item: "Toplam Gider", amount: totalExpense });
  summarySheet.addRow({ item: "Net Durum", amount: net });
  
  // Boş Satır
  summarySheet.addRow({});
  
  // Ana Kategori Gider Dağılımı Başlığı
  const catHeaderRow = summarySheet.addRow({ item: "Ana Kategori Gider Dağılımı", amount: "" });
  catHeaderRow.font = { name: "Arial", size: 11, bold: true };
  catHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEEEEE" },
  };

  // Kategorileri ekle ve Tutar sütununu formatla
  Object.values(categoryTotals)
    .sort((a, b) => b.total - a.total)
    .forEach((cat) => {
      summarySheet.addRow({ item: cat.name, amount: cat.total });
    });

  // Tutar sütununu (B sütunu) formatla
  summarySheet.getColumn("amount").eachCell({ includeEmpty: false }, (cell, rowNumber) => {
    if (rowNumber > 1 && typeof cell.value === "number") {
      cell.numFmt = '#,##0.00" ₺"';
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // DOSYAYI OLUŞTUR VE İNDİR
  // ─────────────────────────────────────────────────────────────────
  
  // Dosya Adı Formatlama
  const formatFileName = (str) => {
    return String(str || "")
      .replace(/ğ/g, "g")
      .replace(/Ğ/g, "G")
      .replace(/ü/g, "u")
      .replace(/Ü/g, "U")
      .replace(/ş/g, "s")
      .replace(/Ş/g, "S")
      .replace(/ı/g, "i")
      .replace(/İ/g, "I")
      .replace(/ö/g, "o")
      .replace(/Ö/g, "O")
      .replace(/ç/g, "c")
      .replace(/Ç/g, "C")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_");
  };

  const safeAppName = formatFileName(appName) || "Bilanco_Raporu";
  const safeMonthName = formatFileName(monthName);
  
  // İstenen Format: Bilanco_Raporu_[Tarih].xlsx
  const today = new Date();
  const dateSuffix = `${String(today.getDate()).padStart(2,"0")}_${String(today.getMonth()+1).padStart(2,"0")}_${today.getFullYear()}`;
  
  const fileName = `Bilanco_Raporu_${dateSuffix}.xlsx`;

  // ArrayBuffer olarak alıp kaydet
  const buffer = await workbook.xlsx.writeBuffer();
  const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(fileBlob, fileName);
}

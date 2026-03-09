import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import CategorySelect from "../components/ui/CategorySelect";
import CurrencyInput from "../components/ui/CurrencyInput";
import DatePicker from "../components/ui/DatePicker";
import {
  RefreshCw,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
  Calendar,
  Clock,
  CreditCard,
} from "lucide-react";

/**
 * Ay atlama hatasını önleyen güvenli tarih hesaplama.
 */
function addMonths(dateStr, n) {
  const d = new Date(dateStr);
  const targetMonth = d.getMonth() + n;
  const year = d.getFullYear() + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(d.getDate(), lastDay);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Aylık" },
  { value: "weekly", label: "Haftalık" },
];

const TYPE_OPTIONS = [
  { value: "income", label: "Gelir" },
  { value: "expense", label: "Gider" },
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}`,
}));

export default function RecurringTransactions() {
  const { user } = useAuth();
  const [recurring, setRecurring] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Varsayılan Bitiş Tarihi: Bugünden tam 1 yıl sonra
  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
  const formattedDefaultEndDate = defaultEndDate.toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    type: "expense",
    category_id: "",
    amount: "",
    description: "",
    frequency: "monthly",
    day_of_month: 1,
    payment_method: "cash",
    end_date: formattedDefaultEndDate,
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: recData }, { data: catData }] = await Promise.all([
      supabase
        .from("recurring_transactions")
        .select("*, categories(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name"),
    ]);
    setRecurring(recData || []);
    setCategories(catData || []);
    setLoading(false);
  };

  /**
   * Kategorileri optgroup yapısına dönüştür (Transactions sayfasındaki gibi)
   */
  const buildGroupedOptions = (type) => {
    if (!type) return { groups: [], standalone: [] };
    const typeCats = categories.filter((c) => c.type === type);
    const parents = typeCats.filter((c) => !c.parent_id);
    const children = typeCats.filter((c) => c.parent_id);

    const groups = [];
    const standalone = [];

    parents.forEach((parent) => {
      const kids = children.filter((c) => c.parent_id === parent.id);
      if (kids.length > 0) {
        groups.push({
          label: parent.name,
          options: [
            { value: parent.id, label: `${parent.name} (Genel)` },
            ...kids.map((k) => ({ value: k.id, label: k.name })),
          ],
        });
      } else {
        standalone.push({ value: parent.id, label: parent.name });
      }
    });

    return { groups, standalone };
  };

  const categoryGrouped = buildGroupedOptions(formData.type);

  const resetForm = () => {
    setFormData({
      type: "expense",
      category_id: "",
      amount: "",
      description: "",
      frequency: "monthly",
      day_of_month: 1,
      payment_method: "cash",
      end_date: formattedDefaultEndDate,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (item) => {
    setFormData({
      type: item.type,
      category_id: item.category_id || "",
      amount: item.amount,
      description: item.description || "",
      frequency: item.frequency,
      day_of_month: item.day_of_month || 1,
      payment_method: item.payment_method || "cash",
      // Eski kayıtlarda end_date yoksa yine varsayılan atılır
      end_date: item.end_date || formattedDefaultEndDate, 
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Lütfen geçerli bir tutar girin.");
      return;
    }
    
    if (!formData.end_date) {
      setError("Lütfen bir bitiş tarihi seçin.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      type: formData.type,
      category_id: formData.category_id || null,
      amount: Number(formData.amount),
      description: formData.description.trim() || null,
      frequency: formData.frequency,
      day_of_month: formData.frequency === "monthly" ? formData.day_of_month : null,
      user_id: user.id,
      payment_method: formData.type === "expense" ? formData.payment_method : "cash",
      end_date: formData.end_date, // Görev 2: Bitiş tarihini kaydet
    };

    const endDateObj = new Date(formData.end_date);
    const todayObj = new Date();
    
    // Kaç ay ekleneceğini (maksimum) güvenli tutuyoruz (Aylık tekil kayıtlar)
    const diffMonths = (endDateObj.getFullYear() - todayObj.getFullYear()) * 12 + (endDateObj.getMonth() - todayObj.getMonth());
    // Haftalık ise kabaca 4 ile çarpılır (bu bir örnektir, asıl üretim logic'ine göre gelişebilir)
    const iterationCount = formData.frequency === "monthly" ? Math.max(1, diffMonths + 1) : Math.max(1, diffMonths * 4 + 1);
    
    // Güvenlik sınırlandırması (Max 60 ay önden yazsın)
    const safeIterationCount = Math.min(iterationCount, 60);

    let result;
    if (editingId) {
      // ── MANTIK: GÜNCELLEME ──
      const { user_id, ...updatePayload } = payload;
      result = await supabase
        .from("recurring_transactions")
        .update(updatePayload)
        .eq("id", editingId);

      if (!result.error) {
        // Eski kopyaları (bugünden itibaren olanları) sil (BÜGÜNDEN BÜYÜK veya ESIT)
        const todayStr = new Date().toISOString().split("T")[0];
        const { error: deleteError } = await supabase
          .from("transactions")
          .delete()
          .eq("group_id", editingId) // Artık yetim bırakmıyoruz, group_id olanları temizliyoruz
          .gte("date", todayStr);

        if (!deleteError) {
          // Yeni ayarlarla BAŞTAN YAZ
          const today = new Date();
          const dayOfMonth = formData.frequency === "monthly" ? formData.day_of_month : today.getDate();
          const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`;

          const rows = Array.from({ length: safeIterationCount }, (_, i) => {
            const calculatedDate = formData.frequency === "monthly" ? addMonths(startDate, i) : addMonths(startDate, 0); // TODO: implement weekly logic properly
            
            return {
              user_id: user.id,
              date: calculatedDate,
              amount: Number(formData.amount),
              type: formData.type,
              category_id: formData.category_id || null,
              description: formData.description.trim() ? `${formData.description.trim()} (otomatik)` : "Otomatik tekrarlayan işlem",
              group_id: editingId,
              payment_method: formData.type === "expense" ? formData.payment_method : "cash",
            };
          }).filter(row => new Date(row.date) <= endDateObj); // Bitiş tarihini geçmemesi için filtrele

          if(rows.length > 0) {
             await supabase.from("transactions").insert(rows);
          }
        }
      }
    } else {
      // ── MANTIK: YENİ KAYIT EKLENMESİ ──
      result = await supabase
        .from("recurring_transactions")
        .insert(payload)
        .select()
        .single();

      if (!result.error && result.data) {
        const newRecordId = result.data.id;

        const today = new Date();
        const dayOfMonth = formData.frequency === "monthly" ? formData.day_of_month : today.getDate();
        const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`;

        const rows = Array.from({ length: safeIterationCount }, (_, i) => {
          const calculatedDate = formData.frequency === "monthly" ? addMonths(startDate, i) : addMonths(startDate, 0); // TODO: implement weekly logic properly
          return {
            user_id: user.id,
            date: calculatedDate,
            amount: Number(formData.amount),
            type: formData.type,
            category_id: formData.category_id || null,
            description: formData.description.trim() ? `${formData.description.trim()} (otomatik)` : "Otomatik tekrarlayan işlem",
            group_id: newRecordId, 
            payment_method: formData.type === "expense" ? formData.payment_method : "cash",
          };
        }).filter(row => new Date(row.date) <= endDateObj);

        if(rows.length > 0) {
          const { error: bulkError } = await supabase.from("transactions").insert(rows);
          if (bulkError) {
             console.error("Bulk insert error:", bulkError);
             setError("Tekrar tanımı eklendi ama gelecek işlemler oluşturulamadı.");
          }
        }
      }
    }

    if (result?.error) {
      setError(result.error.message);
    } else {
      setSuccess(
        editingId
          ? "Otomatik işlem güncellendi!"
          : "Otomatik işlem tanımı eklendi ve sisteme kayıtlandı!",
      );
      setTimeout(() => setSuccess(""), 3000);
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    // Görev 1: Önce transactions tablosundaki BÜGÜNDEN BÜYÜK veya ESIT yetim kayıtları sil
    const todayStr = new Date().toISOString().split("T")[0];
    await supabase.from("transactions").delete().eq("group_id", deleteId).gte("date", todayStr);

    // Sonra recurring_transactions tablosundan kuralın kendisini sil
    const { error } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", deleteId);

    if (!error) {
      setSuccess("Otomatik işlem silindi. Gelecek ödemeler de iptal edildi.");
      setTimeout(() => setSuccess(""), 3000);
      fetchData();
    } else {
      setError("Silinirken hata oluştu.");
    }
    setDeleteId(null);
  };

  const toggleActive = async (id, currentlyActive) => {
    const { error } = await supabase
      .from("recurring_transactions")
      .update({ is_active: !currentlyActive })
      .eq("id", id);
    if (!error) fetchData();
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <RefreshCw className="w-7 h-7 text-blue-600" />
            Otomatik İşlemler
          </h1>
          <p className="text-gray-500 mt-1">
            Tekrarlayan gelir ve giderlerinizi tanımlayın, sistem sizin yerinize takip etsin.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? (
             <><X className="w-4 h-4 mr-1.5" /> İptal Et</>
          ) : (
             <><Plus className="w-4 h-4 mr-1.5" /> Yeni Otomasyon</>
          )}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium animate-fade-in">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button
            onClick={() => setError("")}
            className="ml-auto cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="animate-fade-in border-blue-100 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            {editingId ? (
              <>
                <Pencil className="w-6 h-6 text-blue-600" />
                Otomasyonu Düzenle
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 text-blue-600" />
                Yeni Finansal Otomasyon
              </>
            )}
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Select
              label="İşlem Türü"
              id="recType"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value,
                  category_id: "",
                  payment_method: "cash" // Tür değişirse güvenli ödeme yöntemi
                })
              }
              options={TYPE_OPTIONS}
            />
            {/* Görev 2: Tailwind Dropdown Component here instead of native Select */}
            <CategorySelect
               label="Kategori"
               id="recCategory"
               value={formData.category_id}
               onChange={(e) => setFormData({ ...formData, category_id: e.target.value }) }
               options={categoryGrouped}
               disabled={!formData.type}
            />
            <CurrencyInput
              label="Tutar"
              id="recAmount"
              value={formData.amount}
              onValueChange={(value) =>
                setFormData({ ...formData, amount: value })
              }
            />
            <Input
              label="Açıklama (Opsiyonel)"
              id="recDescription"
              placeholder="Aylık internet faturası vb."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Görev 3: Görsel Gruplama Kutusu */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mt-6 space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Select
                label="Tekrar Sıklığı"
                id="recFrequency"
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value })
                }
                options={FREQUENCY_OPTIONS}
              />
              
              {formData.frequency === "monthly" && (
                <Select
                  label="Ayın Günü"
                  id="recDayOfMonth"
                  value={formData.day_of_month}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      day_of_month: Number(e.target.value),
                    })
                  }
                  options={DAY_OPTIONS}
                />
              )}
              
              {/* Görev 2: Bitiş Tarihi */}
              <div className="relative">
                <DatePicker
                   label="Son Tekrar Ayı / Bitiş Tarihi"
                   id="recEndDate"
                   value={formData.end_date}
                   onChange={(dateStr) => setFormData({ ...formData, end_date: dateStr }) }
                />
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">Sonsuz tekrarları önlemek için bir yıl sonrası önerilir.</p>
              </div>
            </div>

            {/* Görev 3: FinTech Ödeme Kartları Seçimi */}
            {formData.type === "expense" && (
               <div className="pt-2">
                 <span className="block text-sm font-semibold text-gray-700 mb-2">Ödeme Yöntemi</span>
                 <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: "cash" })}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                        formData.payment_method === "cash"
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-medium shadow-sm ring-1 ring-blue-500/20"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white"
                      }`}
                    >
                      Banka / Nakit
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: "credit_card" })}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                        formData.payment_method === "credit_card"
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-medium shadow-sm ring-1 ring-blue-500/20"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Kredi Kartı
                    </button>
                 </div>
               </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={resetForm}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] shadow-md shadow-blue-500/20">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Check className="w-4 h-4 mr-1.5" />
              )}
              {editingId ? "Güncelle" : "Otomasyonu Kaydet"}
            </Button>
          </div>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : recurring.length === 0 ? (
        <Card className="text-center py-16 border-dashed border-2 bg-gray-50/50">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-900 font-medium text-lg">
            Henüz otomatik işlem tanımlamadınız.
          </p>
          <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
            Faturalar, maaşlar veya aidatlar gibi sürekli işlemlerinizi ekleyerek zaman kazanın.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recurring.map((item) => (
            <Card
              key={item.id}
              padding="p-0"
              className={`overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md border-gray-200 ${
                !item.is_active ? "opacity-60 saturate-50" : ""
              }`}
            >
               {/* Üst Kısım: Kimlik Tepsibi ve Butonlar */}
               <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-white relative">
                   {/* Left Side Info */}
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                          <span
                             className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                item.type === "income"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                             }`}
                           >
                             {item.type === "income" ? "Gelir" : "Gider"}
                          </span>
                          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 flex items-center gap-1 py-0.5 rounded-full">
                              <RefreshCw className="w-3 h-3 text-gray-600"/>
                              Aylık
                          </span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 leading-tight">
                          {item.categories?.name || "Kategorisiz İşlem"}
                      </h4>
                      {item.description && (
                         <p className="text-sm text-gray-500 mt-0.5 truncate max-w-[200px]" title={item.description}>
                            {item.description}
                         </p>
                      )}
                   </div>

                   {/* Right Side Info (Amount & Delete) */}
                   <div className="text-right flex flex-col items-end gap-2">
                      <span
                         className={`text-xl font-bold tracking-tight ${
                             item.type === "income"
                               ? "text-emerald-600"
                               : "text-rose-600"
                         }`}
                       >
                         {formatCurrency(item.amount)}
                      </span>
                      <div className="flex items-center gap-2 mt-auto">
                         <button
                           onClick={() => openEditForm(item)}
                           className="p-1.5 rounded bg-gray-50 hover:bg-gray-200 transition-colors text-gray-600"
                           title="Düzenle"
                         >
                           <Pencil className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => setDeleteId(item.id)}
                           className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 transition-colors text-rose-600"
                           title="Kuralı ve gelecekteki işlemleri sil"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
               </div>

               {/* Alt Kısım: Detaylar ve Aktif Etme */}
               <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                   <div className="flex flex-col gap-1">
                       <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium tracking-wide">
                          <Calendar className="w-3.5 h-3.5" />
                          Her ayın {item.day_of_month}. günü üretilecek
                       </span>
                       <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium tracking-wide">
                          Bitiş: {item.end_date ? new Date(item.end_date).toLocaleDateString("tr-TR") : "Süresiz"}
                       </span>
                   </div>

                   <button
                     onClick={() => toggleActive(item.id, item.is_active)}
                     className="shrink-0 cursor-pointer ml-4 flex items-center justify-center"
                     title={item.is_active ? "Durdur" : "Devam Ettir"}
                   >
                     {item.is_active ? (
                       <ToggleRight className="w-10 h-10 text-emerald-500 hover:text-emerald-600 transition-colors drop-shadow-sm" />
                     ) : (
                       <ToggleLeft className="w-10 h-10 text-gray-400 hover:text-gray-500 transition-colors" />
                     )}
                   </button>
               </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <Card className="w-full max-w-md shadow-2xl scale-100 border-0 ring-1 ring-white/10">
            <div className="flex items-center gap-3 text-red-600 mb-4">
               <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                   <AlertCircle className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold bg-white text-gray-900">
                  Otomasyonu İptal Et
               </h3>
            </div>
            <div className="text-sm text-gray-600 mb-6 bg-red-50 p-4 rounded-xl border border-red-100 leading-relaxed">
               Bu tekrarlayan kural silinecek. Ayrıca, <strong>bugünden ileri bir tarihte</strong> oluşturulmuş ve henüz vadesi gelmemiş olan tüm işlemleri de <strong>silinecektir</strong>. Geçmişte gerçekleşmiş işlemler zarar görmez. Onaylıyor musunuz?
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteId(null)}>
                Vazgeç
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-1.5" />
                Evet, Tamamen Sil
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

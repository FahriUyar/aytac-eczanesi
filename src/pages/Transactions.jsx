import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import CurrencyInput from "../components/ui/CurrencyInput";
import DatePicker from "../components/ui/DatePicker";
import {
  Plus,
  Trash2,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
} from "lucide-react";

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const TYPE_OPTIONS = [
  { value: "income", label: "Gelir" },
  { value: "expense", label: "Gider" },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export default function Transactions() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    type: "",
    category_id: "",
    description: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [selectedMonth, selectedYear]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    setCategories(data || []);
  };

  const fetchTransactions = async () => {
    setLoading(true);
    const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
    const endDate =
      selectedMonth === 11
        ? `${selectedYear + 1}-01-01`
        : `${selectedYear}-${String(selectedMonth + 2).padStart(2, "0")}-01`;

    const { data, error } = await supabase
      .from("transactions")
      .select("*, categories(name)")
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError("İşlemler yüklenirken hata oluştu.");
      console.error(error);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  const filteredCategoryOptions = useMemo(() => {
    return categories
      .filter((c) => c.type === formData.type)
      .map((c) => ({ value: c.id, label: c.name }));
  }, [categories, formData.type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { error } = await supabase.from("transactions").insert({
      date: formData.date,
      amount: formData.amount,
      type: formData.type,
      category_id: formData.category_id || null,
      description: formData.description.trim() || null,
    });

    if (error) {
      setError("İşlem eklenirken hata oluştu.");
      console.error(error);
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        amount: 0,
        type: "",
        category_id: "",
        description: "",
      });
      setShowForm(false);
      fetchTransactions();
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      setError("İşlem silinirken hata oluştu.");
    } else {
      setDeleteConfirm(null);
      fetchTransactions();
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const monthTotals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <ArrowLeftRight className="w-7 h-7 text-primary-600" />
            İşlemler
          </h1>
          <p className="text-text-secondary mt-1">
            Gelir ve gider işlemlerinizi yönetin.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Kapat
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Yeni İşlem
            </>
          )}
        </Button>
      </div>

      {/* Add Transaction Form */}
      {showForm && (
        <Card className="animate-fade-in border-primary-200">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Yeni İşlem Ekle
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <DatePicker
                  label="Tarih"
                  id="txDate"
                  value={formData.date}
                  onChange={(dateStr) =>
                    setFormData({ ...formData, date: dateStr })
                  }
                />
              </div>
              <CurrencyInput
                label="Tutar"
                id="txAmount"
                value={formData.amount}
                onValueChange={(num) =>
                  setFormData({ ...formData, amount: num })
                }
                required
              />
              <Select
                label="Tür"
                id="txType"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value,
                    category_id: "",
                  })
                }
                options={TYPE_OPTIONS}
                placeholder="Gelir / Gider"
                required
              />
              <Select
                label="Kategori"
                id="txCategory"
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
                options={filteredCategoryOptions}
                placeholder={
                  formData.type ? "Kategori seçin" : "Önce tür seçin"
                }
                disabled={!formData.type}
              />
            </div>
            <Input
              label="Açıklama (opsiyonel)"
              id="txDescription"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="İşlem açıklaması..."
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                İşlemi Kaydet
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-50 border border-danger-500/20 text-danger-700 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Month Selector & Summary */}
      <div className="flex flex-wrap items-center gap-4">
        <Card padding="p-3" className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-text-secondary cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-3 min-w-[180px] justify-center">
            <Calendar className="w-4 h-4 text-primary-600" />
            <span className="font-semibold text-text-primary">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
          </div>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-text-secondary cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </Card>

        <div className="flex items-center gap-4 ml-auto text-sm">
          <span className="flex items-center gap-1.5 text-success-700">
            <TrendingUp className="w-4 h-4" />
            {formatCurrency(monthTotals.income)}
          </span>
          <span className="flex items-center gap-1.5 text-danger-700">
            <TrendingDown className="w-4 h-4" />
            {formatCurrency(monthTotals.expense)}
          </span>
          <span
            className={`font-semibold ${
              monthTotals.net >= 0 ? "text-success-700" : "text-danger-700"
            }`}
          >
            Net: {formatCurrency(monthTotals.net)}
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <Card padding="p-0" className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium text-text-secondary">
              Bu ay için işlem bulunamadı.
            </p>
            <p className="text-sm mt-1">
              Yeni bir işlem eklemek için yukarıdaki butonu kullanın.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left px-6 py-3 font-medium text-text-secondary">
                    Tarih
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-text-secondary">
                    Tür
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-text-secondary">
                    Kategori
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-text-secondary">
                    Açıklama
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-text-secondary">
                    Tutar
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-text-secondary">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border/50 hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-3.5 text-text-primary whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          tx.type === "income"
                            ? "bg-success-50 text-success-700"
                            : "bg-danger-50 text-danger-700"
                        }`}
                      >
                        {tx.type === "income" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {tx.type === "income" ? "Gelir" : "Gider"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-text-secondary">
                      {tx.categories?.name || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-text-secondary max-w-[200px] truncate">
                      {tx.description || "—"}
                    </td>
                    <td
                      className={`px-6 py-3.5 text-right font-semibold whitespace-nowrap ${
                        tx.type === "income"
                          ? "text-success-700"
                          : "text-danger-700"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {deleteConfirm === tx.id ? (
                        <div className="flex items-center justify-end gap-2 animate-fade-in">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(tx.id)}
                          >
                            Sil
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            İptal
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(tx.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-muted hover:text-danger-600 hover:bg-danger-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

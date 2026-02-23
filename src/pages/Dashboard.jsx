import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownRight,
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

const formatCurrency = (amount) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount);

export default function Dashboard() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [selectedMonth, selectedYear]);

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
      .order("date", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
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

  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  const recentTransactions = useMemo(
    () => transactions.slice(0, 8),
    [transactions],
  );

  const categoryBreakdown = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      const catName = tx.categories?.name || "Kategorisiz";
      const key = `${catName}-${tx.type}`;
      if (!map[key]) {
        map[key] = { name: catName, type: tx.type, total: 0 };
      }
      map[key].total += Number(tx.amount);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [transactions]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-primary-600" />
            Finansal Özet
          </h1>
          <p className="text-text-secondary mt-1">
            Aylık gelir, gider ve net durumunuz.
          </p>
        </div>

        {/* Month Selector */}
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
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid sm:grid-cols-3 gap-4 lg:gap-6">
            {/* Total Income */}
            <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-success-500/5 rounded-bl-[60px] group-hover:bg-success-500/10 transition-colors" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success-600" />
                  </div>
                  <span className="text-sm font-medium text-text-secondary">
                    Toplam Gelir
                  </span>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-success-700">
                  {formatCurrency(totals.income)}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {transactions.filter((t) => t.type === "income").length} işlem
                </p>
              </div>
            </Card>

            {/* Total Expense */}
            <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-danger-500/5 rounded-bl-[60px] group-hover:bg-danger-500/10 transition-colors" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-danger-600" />
                  </div>
                  <span className="text-sm font-medium text-text-secondary">
                    Toplam Gider
                  </span>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-danger-700">
                  {formatCurrency(totals.expense)}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {transactions.filter((t) => t.type === "expense").length}{" "}
                  işlem
                </p>
              </div>
            </Card>

            {/* Net */}
            <Card
              className={`relative overflow-hidden group hover:shadow-md transition-shadow ${
                totals.net >= 0
                  ? "ring-1 ring-success-200"
                  : "ring-1 ring-danger-200"
              }`}
            >
              <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[60px] transition-colors ${
                  totals.net >= 0
                    ? "bg-primary-500/5 group-hover:bg-primary-500/10"
                    : "bg-warning-500/5 group-hover:bg-warning-500/10"
                }`}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      totals.net >= 0 ? "bg-primary-50" : "bg-warning-50"
                    }`}
                  >
                    <Wallet
                      className={`w-5 h-5 ${
                        totals.net >= 0
                          ? "text-primary-600"
                          : "text-warning-600"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-secondary">
                    Net Durum
                  </span>
                </div>
                <p
                  className={`text-2xl lg:text-3xl font-bold ${
                    totals.net >= 0 ? "text-primary-700" : "text-danger-700"
                  }`}
                >
                  {formatCurrency(totals.net)}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {totals.net >= 0 ? "Kâr" : "Zarar"}
                </p>
              </div>
            </Card>
          </div>

          {/* Bottom section: Recent + Category Breakdown */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Son İşlemler
              </h2>
              {recentTransactions.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">
                  Bu ay için işlem bulunamadı.
                </p>
              ) : (
                <ul className="space-y-2">
                  {recentTransactions.map((tx) => (
                    <li
                      key={tx.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            tx.type === "income"
                              ? "bg-success-50"
                              : "bg-danger-50"
                          }`}
                        >
                          {tx.type === "income" ? (
                            <ArrowUpRight className="w-4 h-4 text-success-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-danger-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {tx.categories?.name || "Kategorisiz"}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {tx.description ||
                              new Date(tx.date).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold whitespace-nowrap ml-3 ${
                          tx.type === "income"
                            ? "text-success-700"
                            : "text-danger-700"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Category Breakdown */}
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Kategorilere Göre Dağılım
              </h2>
              {categoryBreakdown.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">
                  Bu ay için veri bulunamadı.
                </p>
              ) : (
                <ul className="space-y-3">
                  {categoryBreakdown.map((item, idx) => {
                    const maxTotal = categoryBreakdown[0]?.total || 1;
                    const widthPercent = Math.max(
                      (item.total / maxTotal) * 100,
                      8,
                    );
                    return (
                      <li key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                item.type === "income"
                                  ? "bg-success-500"
                                  : "bg-danger-500"
                              }`}
                            />
                            {item.name}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              item.type === "income"
                                ? "text-success-700"
                                : "text-danger-700"
                            }`}
                          >
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.type === "income"
                                ? "bg-success-500"
                                : "bg-danger-500"
                            }`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

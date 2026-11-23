"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  TrendingUp,
  Wallet,
  Building2,
  RefreshCw,
  Receipt,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { getBranch, getLeads, getExpenses } from "@/app/fetch/get/fetch";

interface Branch {
  id: string;
  name: string;
}

interface Lead {
  id: number;
  name: string;
  nominal: number;
  branch_id: string;
  status_id: string;
  created_at?: string;
  branches?: { name: string } | null;
  status?: { name: string } | null;
}

interface Expense {
  id: string;
  amount: number;
  branch_id: string;
  category_id: string;
  created_at?: string;
  branches?: { name: string } | null;
  expense_categories?: { name: string } | null;
}

const BRANCH_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
];

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateKey = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatShortDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Raw data from API
  const [branches, setBranches] = useState<Branch[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Filter state
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = async () => {
    try {
      const [branchesRes, leadsData, expensesData] = await Promise.all([
        getBranch(),
        getLeads(),
        getExpenses(),
      ]);

      const branchList: Branch[] = branchesRes?.data || [];
      const leadList: Lead[] = leadsData || [];
      const expenseList: Expense[] = expensesData || [];

      setBranches(branchList);
      setLeads(leadList);
      setExpenses(expenseList);

      // Auto-populate start and end dates from data if not set yet
      const allDates = [
        ...leadList.map((l) => formatDateKey(l.created_at)),
        ...expenseList.map((e) => formatDateKey(e.created_at)),
      ].filter(Boolean);

      if (allDates.length > 0) {
        allDates.sort();
        const minDate = allDates[0];
        const maxDate = allDates[allDates.length - 1];

        setStartDate((prev) => (prev ? prev : minDate));
        setEndDate((prev) => (prev ? prev : maxDate));
      } else {
        const today = new Date().toISOString().split("T")[0];
        setStartDate((prev) => (prev ? prev : today));
        setEndDate((prev) => (prev ? prev : today));
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    async function checkUserAndLoad() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);
        await fetchData();
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkUserAndLoad();
  }, [router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleResetFilter = () => {
    setSelectedBranch("all");
    const allDates = [
      ...leads.map((l) => formatDateKey(l.created_at)),
      ...expenses.map((e) => formatDateKey(e.created_at)),
    ].filter(Boolean);

    if (allDates.length > 0) {
      allDates.sort();
      setStartDate(allDates[0]);
      setEndDate(allDates[allDates.length - 1]);
    }
  };

  // Filtered Leads and Expenses
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (selectedBranch !== "all" && lead.branch_id !== selectedBranch) {
        return false;
      }
      const dateKey = formatDateKey(lead.created_at);
      if (startDate && dateKey < startDate) return false;
      if (endDate && dateKey > endDate) return false;
      return true;
    });
  }, [leads, selectedBranch, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (selectedBranch !== "all" && expense.branch_id !== selectedBranch) {
        return false;
      }
      const dateKey = formatDateKey(expense.created_at);
      if (startDate && dateKey < startDate) return false;
      if (endDate && dateKey > endDate) return false;
      return true;
    });
  }, [expenses, selectedBranch, startDate, endDate]);

  // Summary Metrics
  const totalOmzet = useMemo(() => {
    return filteredLeads.reduce(
      (sum, item) => sum + (Number(item.nominal) || 0),
      0,
    );
  }, [filteredLeads]);

  const totalPengeluaran = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    );
  }, [filteredExpenses]);

  const totalClosingLeads = useMemo(() => {
    return filteredLeads.filter(
      (l) => l.status?.name?.toLowerCase() === "closing",
    ).length;
  }, [filteredLeads]);

  const netProfit = totalOmzet - totalPengeluaran;

  // Timeline / Daily Omzet Trend Data
  const dailyTimelineData = useMemo(() => {
    const map: { [key: string]: { date: string; omzet: number; pengeluaran: number } } = {};

    // Group leads
    filteredLeads.forEach((lead) => {
      const dKey = formatDateKey(lead.created_at);
      if (!dKey) return;
      if (!map[dKey]) {
        map[dKey] = { date: dKey, omzet: 0, pengeluaran: 0 };
      }
      map[dKey].omzet += Number(lead.nominal) || 0;
    });

    // Group expenses
    filteredExpenses.forEach((exp) => {
      const dKey = formatDateKey(exp.created_at);
      if (!dKey) return;
      if (!map[dKey]) {
        map[dKey] = { date: dKey, omzet: 0, pengeluaran: 0 };
      }
      map[dKey].pengeluaran += Number(exp.amount) || 0;
    });

    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        label: formatShortDate(item.date),
      }));
  }, [filteredLeads, filteredExpenses]);

  const averageDailyOmzet = useMemo(() => {
    if (dailyTimelineData.length === 0) return 0;
    return totalOmzet / dailyTimelineData.length;
  }, [totalOmzet, dailyTimelineData]);

  const highestDailyOmzet = useMemo(() => {
    if (dailyTimelineData.length === 0) return 0;
    return Math.max(...dailyTimelineData.map((d) => d.omzet));
  }, [dailyTimelineData]);

  // Branch Performance Comparison Data (Revenue & Expense by Branch)
  const branchComparisonData = useMemo(() => {
    return branches.map((b) => {
      const bLeads = leads.filter((l) => {
        if (l.branch_id !== b.id) return false;
        const d = formatDateKey(l.created_at);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });

      const bExpenses = expenses.filter((e) => {
        if (e.branch_id !== b.id) return false;
        const d = formatDateKey(e.created_at);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });

      const omzet = bLeads.reduce(
        (acc, curr) => acc + (Number(curr.nominal) || 0),
        0,
      );
      const pengeluaran = bExpenses.reduce(
        (acc, curr) => acc + (Number(curr.amount) || 0),
        0,
      );

      return {
        branchId: b.id,
        branchName: b.name,
        omzet,
        pengeluaran,
        profit: omzet - pengeluaran,
        totalLeads: bLeads.length,
      };
    });
  }, [branches, leads, expenses, startDate, endDate]);

  // Per-Branch Trend Data for Each Branch Card/Chart
  const perBranchCharts = useMemo(() => {
    // If a branch is selected, show only that branch; if "all", show each branch
    const targetBranches =
      selectedBranch === "all"
        ? branches
        : branches.filter((b) => b.id === selectedBranch);

    return targetBranches.map((b, index) => {
      const bLeads = leads.filter((l) => {
        if (l.branch_id !== b.id) return false;
        const d = formatDateKey(l.created_at);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });

      const bExpenses = expenses.filter((e) => {
        if (e.branch_id !== b.id) return false;
        const d = formatDateKey(e.created_at);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });

      // Group timeline by date
      const dateMap: { [key: string]: { date: string; omzet: number; pengeluaran: number } } = {};
      bLeads.forEach((l) => {
        const d = formatDateKey(l.created_at);
        if (!d) return;
        if (!dateMap[d]) dateMap[d] = { date: d, omzet: 0, pengeluaran: 0 };
        dateMap[d].omzet += Number(l.nominal) || 0;
      });

      bExpenses.forEach((e) => {
        const d = formatDateKey(e.created_at);
        if (!d) return;
        if (!dateMap[d]) dateMap[d] = { date: d, omzet: 0, pengeluaran: 0 };
        dateMap[d].pengeluaran += Number(e.amount) || 0;
      });

      const timeline = Object.values(dateMap)
        .sort((x, y) => x.date.localeCompare(y.date))
        .map((item) => ({
          ...item,
          label: formatShortDate(item.date),
        }));

      const totalBranchOmzet = bLeads.reduce(
        (sum, item) => sum + (Number(item.nominal) || 0),
        0,
      );
      const totalBranchExpense = bExpenses.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0,
      );

      return {
        id: b.id,
        name: b.name,
        color: BRANCH_COLORS[index % BRANCH_COLORS.length],
        totalOmzet: totalBranchOmzet,
        totalExpense: totalBranchExpense,
        leadCount: bLeads.length,
        timeline,
      };
    });
  }, [branches, selectedBranch, leads, expenses, startDate, endDate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Memuat data Dashboard...</p>
        </div>
      </div>
    );
  }

  const selectedBranchName =
    selectedBranch === "all"
      ? "Semua Cabang"
      : branches.find((b) => b.id === selectedBranch)?.name || "Cabang";

  return (
    <main className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Ringkasan real-time omzet, performa cabang, dan arus keuangan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              title="Perbarui Data"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin text-emerald-600" : ""}
              />
              <span>{refreshing ? "Memperbarui..." : "Refresh"}</span>
            </button>
            <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-600 shadow-sm">
              Login:{" "}
              <span className="font-semibold text-slate-800">
                {user?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-800">
                Filter Laporan
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-400">
              Menampilkan {filteredLeads.length} transaksi project &{" "}
              {filteredExpenses.length} pengeluaran
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Cabang
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50"
              >
                <option value="all">Semua Cabang ({branches.length})</option>
                {branches.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleResetFilter}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Total Omzet</p>
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <Wallet size={20} />
              </div>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {formatRupiah(totalOmzet)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <Receipt size={14} className="text-emerald-500" />
              <span>{filteredLeads.length} total project masuk</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                Total Pengeluaran
              </p>
              <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
                <TrendingUp size={20} className="rotate-180" />
              </div>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {formatRupiah(totalPengeluaran)}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <Receipt size={14} className="text-rose-500" />
              <span>{filteredExpenses.length} transaksi pengeluaran</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Laba Bersih</p>
              <div
                className={`rounded-xl p-2.5 ${
                  netProfit >= 0
                    ? "bg-blue-50 text-blue-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                <ArrowUpRight size={20} />
              </div>
            </div>
            <h2
              className={`mt-3 text-2xl font-bold tracking-tight ${
                netProfit >= 0 ? "text-slate-900" : "text-amber-600"
              }`}
            >
              {formatRupiah(netProfit)}
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              Omzet dikurangi pengeluaran operasional
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                Rata-rata Omzet / Hari
              </p>
              <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                <Building2 size={20} />
              </div>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {formatRupiah(averageDailyOmzet)}
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              Tertinggi: {formatRupiah(highestDailyOmzet)}
            </p>
          </div>
        </section>

        {/* Main Combined Daily Trend Chart */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Grafik Pergerakan Omzet & Pengeluaran
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Tren transaksi harian berdasarkan rentang waktu terpilih.
              </p>
            </div>

            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              {selectedBranchName}
            </span>
          </div>

          {dailyTimelineData.length === 0 ? (
            <div className="flex h-[320px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-slate-400">
              <CalendarDays className="mb-2 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium">
                Belum ada data transaksi pada rentang tanggal ini
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Silakan ubah filter tanggal atau cabang untuk melihat grafik
              </p>
            </div>
          ) : (
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyTimelineData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="omzetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pengeluaranGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickMargin={12}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(value) =>
                      value >= 1000000
                        ? `${(value / 1000000).toLocaleString("id-ID")} jt`
                        : `${value / 1000} rb`
                    }
                    width={65}
                  />

                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatRupiah(Number(value)),
                      name === "omzet" ? "Omzet" : "Pengeluaran",
                    ]}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 16, fontSize: "12px" }}
                    formatter={(value) => (
                      <span className="text-slate-700 capitalize">
                        {value === "omzet" ? "Omzet Masuk" : "Pengeluaran"}
                      </span>
                    )}
                  />

                  <Area
                    type="monotone"
                    dataKey="omzet"
                    name="omzet"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#omzetGradient)"
                    activeDot={{
                      r: 5,
                      strokeWidth: 2,
                      stroke: "#ffffff",
                      fill: "#10b981",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="pengeluaran"
                    name="pengeluaran"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    fill="url(#pengeluaranGradient)"
                    activeDot={{
                      r: 5,
                      strokeWidth: 2,
                      stroke: "#ffffff",
                      fill: "#ef4444",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Branch Comparison Overview (Bar Chart) */}
        {selectedBranch === "all" && branchComparisonData.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Perbandingan Omzet & Pengeluaran Antar Cabang
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Perbandingan performa finansial seluruh cabang yang diperoleh dari database.
                </p>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={branchComparisonData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="branchName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                    tickMargin={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(value) =>
                      value >= 1000000
                        ? `${(value / 1000000).toLocaleString("id-ID")} jt`
                        : `${value / 1000} rb`
                    }
                    width={65}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatRupiah(Number(value)),
                      name === "omzet" ? "Omzet" : "Pengeluaran",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 16, fontSize: "12px" }}
                    formatter={(value) => (
                      <span className="text-slate-700 capitalize">
                        {value === "omzet" ? "Total Omzet" : "Total Pengeluaran"}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="omzet"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="pengeluaran"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Charts For Each Individual Branch */}
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Grafik Detail Tiap Cabang
              </h2>
              <p className="text-xs text-slate-500">
                Pergerakan omzet harian yang dipetakan secara terpisah untuk setiap cabang dari API.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {perBranchCharts.map((item) => {
              const hasData = item.timeline.length > 0;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <h3 className="text-base font-semibold text-slate-800">
                        {item.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">Omzet: </span>
                        <span className="font-semibold text-emerald-600">
                          {formatRupiah(item.totalOmzet)}
                        </span>
                      </div>
                      <span className="text-slate-300">|</span>
                      <div>
                        <span className="text-slate-400">Pengeluaran: </span>
                        <span className="font-semibold text-rose-500">
                          {formatRupiah(item.totalExpense)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {hasData ? (
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={item.timeline}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id={`gradient-${item.id}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={item.color}
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor={item.color}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            stroke="#f1f5f9"
                            strokeDasharray="3 3"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                            tickFormatter={(v) =>
                              v >= 1000000
                                ? `${(v / 1000000).toLocaleString("id-ID")} jt`
                                : `${v / 1000} rb`
                            }
                            width={50}
                          />
                          <Tooltip
                            formatter={(v: any, name: any) => [
                              formatRupiah(Number(v)),
                              name === "omzet" ? "Omzet" : "Pengeluaran",
                            ]}
                            contentStyle={{
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              fontSize: "11px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="omzet"
                            name="omzet"
                            stroke={item.color}
                            strokeWidth={2}
                            fill={`url(#gradient-${item.id})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-[220px] flex-col items-center justify-center rounded-xl bg-slate-50/70 p-4 text-center text-slate-400">
                      <p className="text-xs font-medium">
                        Belum ada transaksi di cabang ini
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-400">
                    <span>{item.leadCount} transaksi project</span>
                    <span
                      className={`font-medium ${
                        item.totalOmzet - item.totalExpense >= 0
                          ? "text-emerald-600"
                          : "text-rose-500"
                      }`}
                    >
                      Laba: {formatRupiah(item.totalOmzet - item.totalExpense)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

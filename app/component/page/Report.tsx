"use client";
import axios from "axios";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  getBranch,
  getLeads,
  getStatus,
  getExpenses,
  getInvoices,
  getExpenseCategories,
} from "@/app/fetch/get/fetch";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  Percent,
  PieChart,
  Loader2,
  Briefcase,
  SlidersHorizontal,
  Calendar,
  Users,
  Landmark,
  UserCheck,
} from "lucide-react";

type Branch = {
  id: string;
  name: string;
};

type StatusOption = {
  id: string;
  name: string;
};

type Lead = {
  id: number;
  name: string;
  nominal: number;
  branch_id: string;
  status_id: string;
  created_at?: string;
  branches?: { name: string } | null;
  status?: { name: string } | null;
};

type Expense = {
  id: string;
  amount: number;
  branch_id: string;
  category_id: string;
  created_at?: string;
  expense_categories?: { name: string } | null;
  branches?: { name: string } | null;
};

type Invoice = {
  id: string;
  margin: number;
  total_prize: number;
  created_at: string;
  lead_id: string;
  leads: { branch_id: string } | null;
};

// Helper to extract YYYY-MM
const getYearMonth = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
};

// Helper to extract starting Monday date of the week as YYYY-MM-DD
const getStartOfWeekDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday adjustment
  const monday = new Date(date.setDate(diff));

  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Format YYYY-MM into Indonesian Month Year label
const formatMonthLabel = (yearMonthStr: string) => {
  if (!yearMonthStr) return "";
  const parts = yearMonthStr.split("-");
  if (parts.length !== 2) return yearMonthStr;
  const [year, month] = parts;
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const idx = parseInt(month, 10) - 1;
  return `${months[idx] || month} ${year}`;
};

// Format Monday YYYY-MM-DD into "Minggu: DD MMM - DD MMM YYYY"
const formatWeekLabel = (mondayStr: string) => {
  if (!mondayStr) return "";
  const monday = new Date(mondayStr);
  if (isNaN(monday.getTime())) return mondayStr;
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const optionsShort: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  const optionsLong: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  const start = monday.toLocaleDateString("id-ID", optionsShort);
  const end = sunday.toLocaleDateString("id-ID", optionsLong);

  return `${start} - ${end}`;
};

const formatRp = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

const SHARE_PROFIT_RATES = {
  branchPIC: 0.35,
  surveyor: 0.35,
  holding: 0.3,
};

export default function Report() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState("");
  const [omsetSource, setOmsetSource] = useState("closing"); // "closing" or "all"

  // Time filter states
  const [timeFilterType, setTimeFilterType] = useState<
    "all" | "month" | "week"
  >("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");

  // Dynamic lists derived from active leads & expenses data
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        try {
          const res = await axios.post("/api/auth/me", { userId: user.id });
          const profile = res.data?.profile;
          // You could optionally store the role here if you want to conditionally render things
        } catch (err) {
          console.error("Failed to load profile", err);
        }

        setUser(user);

        const [
          branchesRes,
          statusRes,
          leadsData,
          expensesData,
          invoicesData,
          categoriesRes,
          advancesRes,
        ] = await Promise.all([
          getBranch(),
          getStatus(),
          getLeads(),
          getExpenses(),
          getInvoices(),
          getExpenseCategories(),
          axios.get("/api/cash-advance"),
        ]);

        setBranches(branchesRes?.data || []);
        setStatuses(statusRes?.data || []);
        setLeads(leadsData || []);
        setExpenses(expensesData || []);
        setInvoices(invoicesData || []);
        setExpenseCategories(
          Array.isArray(categoriesRes)
            ? categoriesRes
            : (categoriesRes as any)?.data || [],
        );
        setAdvances(advancesRes.data || []);
      } catch (err) {
        console.error("Error initializing report page:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  // Reactively compute available months/weeks list from ALL raw data (no branch filter —
  // the dropdowns should always show every month/week that exists in the dataset).
  useEffect(() => {
    const allDates = [
      ...leads.map((l) => l.created_at),
      ...expenses.map((e) => e.created_at),
      ...invoices.map((i) => i.created_at),
    ];

    console.log("LEADS:", leads);
    console.log("EXPENSES:", expenses);
    console.log("INVOICES:", invoices);
    console.log("ALL DATES:", allDates);
    console.log("MONTHS:", allDates.map(getYearMonth));

    const uniqueMonths = Array.from(
      new Set(allDates.map(getYearMonth).filter(Boolean)),
    )
      .sort()
      .reverse();

    const uniqueWeeks = Array.from(
      new Set(allDates.map(getStartOfWeekDate).filter(Boolean)),
    )
      .sort()
      .reverse();

    setAvailableMonths(uniqueMonths);
    setAvailableWeeks(uniqueWeeks);

    // Set defaults only on first load (when nothing is selected yet)
    setSelectedMonth((prev) =>
      prev && uniqueMonths.includes(prev) ? prev : (uniqueMonths[0] ?? ""),
    );
    setSelectedWeek((prev) =>
      prev && uniqueWeeks.includes(prev) ? prev : (uniqueWeeks[0] ?? ""),
    );
  }, [leads, expenses, invoices]);

  // ---- Filtering logic ----
  const filteredLeads = leads.filter((lead) => {
    if (selectedBranch && lead.branch_id !== selectedBranch) return false;
    if (omsetSource === "closing") {
      if (lead.status?.name?.toLowerCase() !== "closing") return false;
    }
    if (timeFilterType === "month") {
      if (!lead.created_at || getYearMonth(lead.created_at) !== selectedMonth)
        return false;
    } else if (timeFilterType === "week") {
      if (
        !lead.created_at ||
        getStartOfWeekDate(lead.created_at) !== selectedWeek
      )
        return false;
    }
    return true;
  });

  const filteredExpenses = expenses.filter((expense) => {
    if (selectedBranch && expense.branch_id !== selectedBranch) return false;
    if (timeFilterType === "month") {
      if (
        !expense.created_at ||
        getYearMonth(expense.created_at) !== selectedMonth
      )
        return false;
    } else if (timeFilterType === "week") {
      if (
        !expense.created_at ||
        getStartOfWeekDate(expense.created_at) !== selectedWeek
      )
        return false;
    }
    return true;
  });

  // Build a set of lead IDs that passed the leads filter (branch + status/omset source + time)
  // This is used to restrict invoice margin to the same scope.
  const filteredLeadIds = new Set(filteredLeads.map((l) => String(l.id)));

  const filteredInvoices = invoices.filter((inv) => {
    // Branch filter — use branch_id from the joined lead
    if (selectedBranch) {
      const invBranch = inv.leads?.branch_id;
      if (invBranch !== selectedBranch) return false;
    }

    // Date filter on invoice's own created_at
    if (timeFilterType === "month") {
      if (!inv.created_at || getYearMonth(inv.created_at) !== selectedMonth)
        return false;
    } else if (timeFilterType === "week") {
      if (
        !inv.created_at ||
        getStartOfWeekDate(inv.created_at) !== selectedWeek
      )
        return false;
    }

    return true;
  });

  // ---- Calculations ----

  // Total margin from all (filtered) invoices
  const totalMargin = filteredInvoices.reduce(
    (sum, inv) => sum + (inv.margin || 0),
    0,
  );

  // Resolve capex & opex category IDs from the fetched categories list.
  // Uses a loose name match (includes) so it works regardless of exact casing or full name.
  const capexCategory = expenseCategories.find(
    (c) =>
      c.name.toLowerCase().includes("capex") ||
      c.name.toLowerCase().includes("apex"),
  );
  const capexCategoryId = capexCategory?.id;
  const capexCategoryName =
    capexCategory?.name || "Capital Expenditure (Capex / Apex)";

  const opexCategory = expenseCategories.find((c) =>
    c.name.toLowerCase().includes("opex"),
  );
  const opexCategoryId = opexCategory?.id;
  const opexCategoryName = opexCategory?.name || "Biaya Operasional (Opex)";

  // Filter by category_id directly — no fragile string comparison on joined data
  const capex = filteredExpenses
    .filter((exp) => exp.category_id === capexCategoryId)
    .reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const opex = filteredExpenses
    .filter((exp) => exp.category_id === opexCategoryId)
    .reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const totalExpenses = capex + opex;

  // Net Profit = Total Margin from invoices - Capex - Opex
  const netProfit = totalMargin - totalExpenses;
  const netProfitMargin = totalMargin > 0 ? (netProfit / totalMargin) * 100 : 0;

  // Share Profit based on net profit
  const shareProfitBranchPIC = netProfit * SHARE_PROFIT_RATES.branchPIC;
  const shareProfitSurveyor = netProfit * SHARE_PROFIT_RATES.surveyor;
  const shareProfitHolding = netProfit * SHARE_PROFIT_RATES.holding;

  // Find branches that have margin in the current filtered period
  const branchesWithMargin = new Set();
  filteredInvoices.forEach((inv) => {
    if ((inv.margin || 0) > 0 && inv.leads?.branch_id) {
      branchesWithMargin.add(inv.leads.branch_id);
    }
  });

  // Subtract Cash Advances for Branch PIC
  const branchPICAdvances = advances
    .filter((adv) => {
      const role = String(
        adv.profiles?.roles?.name || adv.profiles?.role || "",
      ).toLowerCase();
      const isBranchPIC = role.includes("branch pic");
      if (!isBranchPIC) return false;

      const profileBranch = adv.profiles?.branch_d || adv.profiles?.branch_id;

      // Filter by selected branch if one is selected
      if (selectedBranch) {
        if (profileBranch !== selectedBranch) return false;
      } else {
        // Only include advance if the branch has margin in this period
        if (!branchesWithMargin.has(profileBranch)) return false;
      }

      return true;
    })
    .reduce((sum, adv) => sum + Number(adv.nominal || 0), 0);

  const finalShareProfitBranchPIC = shareProfitBranchPIC - branchPICAdvances;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-medium text-zinc-500">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-950" />
          <span>Memuat laporan keuangan...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 text-black">
      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 font-sans">
            Laporan Keuangan
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Ikhtisar margin invoices, capex, opex, net profit, dan share profit.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold shadow-sm">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse text-zinc-800" />
          <span>Data Real-time Sistem</span>
        </div>
      </div>

      {/* Filter and Input Controls Panel */}
      <div className="bg-white border border-zinc-200/80 shadow-sm rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <SlidersHorizontal size={16} className="text-zinc-500" />
          <h3 className="font-bold text-sm text-zinc-950 uppercase tracking-wider">
            Parameter Laporan
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Branch Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building size={14} className="text-zinc-400" />
              Cabang (Branch)
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
            >
              <option value="">Semua Cabang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Omset Source Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase size={14} className="text-zinc-400" />
              Sumber Omset (Leads)
            </label>
            <select
              value={omsetSource}
              onChange={(e) => setOmsetSource(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
            >
              <option value="closing">
                Hanya Leads Status Closing (Standar)
              </option>
              <option value="all">Semua Status Leads (Pendapatan Kotor)</option>
            </select>
          </div>

          {/* Time Filter Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-zinc-400" />
              Filter Rentang Waktu
            </label>
            <select
              value={timeFilterType}
              onChange={(e) => setTimeFilterType(e.target.value as any)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
            >
              <option value="all">Semua Waktu</option>
              <option value="month">Per Bulan</option>
              <option value="week">Per Minggu</option>
            </select>
          </div>

          {timeFilterType === "month" && (
            <div className="space-y-1.5 transition-all">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-zinc-400" />
                Pilih Bulan
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
              >
                {availableMonths.length === 0 ? (
                  <option value="">Tidak ada data bulan</option>
                ) : (
                  availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthLabel(m)}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {timeFilterType === "week" && (
            <div className="space-y-1.5 transition-all">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-zinc-400" />
                Pilih Minggu
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
              >
                {availableWeeks.length === 0 ? (
                  <option value="">Tidak ada data minggu</option>
                ) : (
                  availableWeeks.map((w) => (
                    <option key={w} value={w}>
                      {formatWeekLabel(w)}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Financial Report Card */}
      <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-8 space-y-6">
        {/* Header */}
        <div className="border-b border-zinc-200 pb-5 text-center md:text-left">
          <h2 className="text-xl font-black text-zinc-950 tracking-tight font-sans">
            LAPORAN LABA RUGI
          </h2>
          <p className="text-[10px] text-zinc-700 font-bold tracking-wider uppercase mt-1 leading-relaxed">
            Periode:{" "}
            {timeFilterType === "all"
              ? "Semua Waktu (Akumulasi)"
              : timeFilterType === "month"
                ? `Bulan ${formatMonthLabel(selectedMonth)}`
                : `Minggu: ${formatWeekLabel(selectedWeek)}`}{" "}
            <br className="md:hidden" />
            <span className="hidden md:inline"> | </span>
            Cabang:{" "}
            {selectedBranch
              ? branches.find((b) => b.id === selectedBranch)?.name
              : "Semua Cabang"}
          </p>
        </div>

        {/* Financial Figures */}
        <div className="space-y-3">
          {/* Total Margin from Invoices */}
          <div className="flex justify-between items-center py-3 border-b border-zinc-100">
            <div className="space-y-0.5">
              <span className="font-semibold text-sm text-zinc-700">
                Total Margin (dari Invoice)
              </span>
              <p className="text-[10px] text-zinc-400 leading-none">
                Jumlah margin dari {filteredInvoices.length} invoice
              </p>
            </div>
            <span className="font-extrabold text-base text-zinc-950">
              {formatRp(totalMargin)}
            </span>
          </div>

          {/* CAPEX / APEX */}
          <div className="flex justify-between items-center py-3 border-b border-zinc-100">
            <div className="space-y-0.5">
              <span className="font-semibold text-sm text-zinc-700">
                {capexCategoryName}
              </span>
              <p className="text-[10px] text-zinc-400 leading-none">
                Pengeluaran kategori {capexCategoryName}
              </p>
            </div>
            <span className="font-extrabold text-base text-red-600">
              - {formatRp(capex)}
            </span>
          </div>

          {/* OPEX */}
          <div className="flex justify-between items-center py-3 border-b border-zinc-100">
            <div className="space-y-0.5">
              <span className="font-semibold text-sm text-zinc-700">
                {opexCategoryName}
              </span>
              <p className="text-[10px] text-zinc-400 leading-none">
                Pengeluaran kategori {opexCategoryName}
              </p>
            </div>
            <span className="font-extrabold text-base text-red-600">
              - {formatRp(opex)}
            </span>
          </div>

          {/* Net Profit */}
          <div
            className={`flex justify-between items-center py-5 rounded-2xl px-5 mt-4 border-2 ${
              netProfit >= 0
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                : "bg-red-50/70 border-red-200 text-red-950"
            }`}
          >
            <div className="space-y-0.5">
              <span className="font-black text-base uppercase tracking-tight">
                Net Profit
              </span>
              <div className="flex items-center gap-1.5">
                {netProfit >= 0 ? (
                  <TrendingUp size={14} className="text-emerald-600" />
                ) : (
                  <TrendingDown size={14} className="text-red-600" />
                )}
                <span className="text-xs font-bold">
                  Margin Bersih: {netProfitMargin.toFixed(1)}%
                </span>
              </div>
              <p className="text-[10px] opacity-70 leading-none mt-1">
                Total Margin - Capex - Opex
              </p>
            </div>
            <span
              className={`text-2xl font-black tracking-tight ${
                netProfit >= 0 ? "text-emerald-800" : "text-red-700"
              }`}
            >
              {formatRp(netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Share Profit Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={18} className="text-zinc-500" />
          <h2 className="text-lg font-bold text-zinc-950 tracking-tight">
            Distribusi Share Profit
          </h2>
        </div>
        <p className="text-xs text-zinc-400 mb-5">
          Pembagian dari Net Profit berdasarkan persentase kesepakatan.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Branch PIC */}
          <div
            className={`rounded-2xl border-2 p-6 space-y-3 ${
              finalShareProfitBranchPIC >= 0
                ? "bg-blue-50/60 border-blue-200"
                : "bg-red-50/60 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <UserCheck size={18} className="text-blue-700" />
                </div>
                <span className="font-bold text-sm text-zinc-800">
                  Branch PIC
                </span>
              </div>
              <span className="text-xs font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                35%
              </span>
            </div>
            <div>
              <span
                className={`text-2xl font-black tracking-tight ${
                  finalShareProfitBranchPIC >= 0
                    ? "text-blue-800"
                    : "text-red-600"
                }`}
              >
                {formatRp(finalShareProfitBranchPIC)}
              </span>
              <div className="text-[10px] text-zinc-400 mt-1 space-y-0.5">
                <p className="text-red-500 font-medium">
                  - Branch PIC advance: {formatRp(branchPICAdvances)}
                </p>
                <p>35% Profit: {formatRp(shareProfitBranchPIC)}</p>
              </div>
            </div>
          </div>

          {/* Surveyor */}
          <div
            className={`rounded-2xl border-2 p-6 space-y-3 ${
              netProfit >= 0
                ? "bg-violet-50/60 border-violet-200"
                : "bg-zinc-50 border-zinc-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-violet-100 rounded-xl">
                  <Users size={18} className="text-violet-700" />
                </div>
                <span className="font-bold text-sm text-zinc-800">
                  Surveyor
                </span>
              </div>
              <span className="text-xs font-black text-violet-700 bg-violet-100 px-2.5 py-1 rounded-full">
                35%
              </span>
            </div>
            <div>
              <span
                className={`text-2xl font-black tracking-tight ${
                  netProfit >= 0 ? "text-violet-800" : "text-zinc-500"
                }`}
              >
                {formatRp(shareProfitSurveyor)}
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                35% × {formatRp(netProfit)}
              </p>
            </div>
          </div>

          {/* Holding */}
          <div
            className={`rounded-2xl border-2 p-6 space-y-3 ${
              netProfit >= 0
                ? "bg-green-50/60 border-green-200"
                : "bg-zinc-50 border-zinc-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-xl">
                  <Landmark size={18} className="text-green-700" />
                </div>
                <span className="font-bold text-sm text-zinc-800">Holding</span>
              </div>
              <span className="text-xs font-black text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                30%
              </span>
            </div>
            <div>
              <span
                className={`text-2xl font-black tracking-tight ${
                  netProfit >= 0 ? "text-green-800" : "text-zinc-500"
                }`}
              >
                {formatRp(shareProfitHolding)}
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                30% × {formatRp(netProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Summary bar */}
        {netProfit > 0 && (
          <div className="mt-5 bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Percent size={15} className="text-zinc-500" />
              <span className="text-xs font-bold text-zinc-600 uppercase tracking-wide">
                Alokasi Share Profit
              </span>
            </div>
            <div className="w-full sm:w-2/3 h-3 bg-zinc-100 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: "35%" }}
                title="Branch PIC 35%"
              />
              <div
                className="bg-violet-500 h-full transition-all"
                style={{ width: "35%" }}
                title="Surveyor 35%"
              />
              <div
                className="bg-green-300 h-full transition-all"
                style={{ width: "30%" }}
                title="Holding 30%"
              />
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-zinc-700">
                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                Branch PIC
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-violet-500 inline-block" />
                Surveyor
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                Holding
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

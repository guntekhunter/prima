"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getBranch, getLeads, getStatus, getExpenses } from "@/app/fetch/get/fetch";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Building,
    FileText,
    Percent,
    PieChart,
    BarChart3,
    ArrowUpRight,
    Loader2,
    Briefcase,
    SlidersHorizontal,
    Calendar
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

// Format YYYY-MM into Indonessian Month Year label
const formatMonthLabel = (yearMonthStr: string) => {
    if (!yearMonthStr) return "";
    const parts = yearMonthStr.split("-");
    if (parts.length !== 2) return yearMonthStr;
    const [year, month] = parts;
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
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
    
    const optionsShort: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    const optionsLong: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    
    const start = monday.toLocaleDateString("id-ID", optionsShort);
    const end = sunday.toLocaleDateString("id-ID", optionsLong);
    
    return `${start} - ${end}`;
};

export default function Report() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [statuses, setStatuses] = useState<StatusOption[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [selectedBranch, setSelectedBranch] = useState("");
    const [omsetSource, setOmsetSource] = useState("closing"); // "closing" or "all"
    const [manualHpp, setManualHpp] = useState<number | "">(0);
    
    // Time filter states
    const [timeFilterType, setTimeFilterType] = useState<"all" | "month" | "week">("all");
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

                setUser(user);

                const [branchesRes, statusRes, leadsData, expensesData] = await Promise.all([
                    getBranch(),
                    getStatus(),
                    getLeads(),
                    getExpenses(),
                ]);

                setBranches(branchesRes?.data || []);
                setStatuses(statusRes?.data || []);
                setLeads(leadsData || []);
                setExpenses(expensesData || []);
            } catch (err) {
                console.error("Error initializing report page:", err);
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [router]);

    // Reactively compute available months/weeks list based on current leads/expenses
    useEffect(() => {
        const leadMonths = leads.map(l => getYearMonth(l.created_at)).filter(Boolean);
        const expMonths = expenses.map(e => getYearMonth(e.created_at)).filter(Boolean);
        const uniqueMonths = Array.from(new Set([...leadMonths, ...expMonths])).sort().reverse();
        setAvailableMonths(uniqueMonths);
        
        const leadWeeks = leads.map(l => getStartOfWeekDate(l.created_at)).filter(Boolean);
        const expWeeks = expenses.map(e => getStartOfWeekDate(e.created_at)).filter(Boolean);
        const uniqueWeeks = Array.from(new Set([...leadWeeks, ...expWeeks])).sort().reverse();
        setAvailableWeeks(uniqueWeeks);
        
        // Dynamic auto-select defaults
        if (uniqueMonths.length > 0 && (!selectedMonth || !uniqueMonths.includes(selectedMonth))) {
            setSelectedMonth(uniqueMonths[0]);
        }
        if (uniqueWeeks.length > 0 && (!selectedWeek || !uniqueWeeks.includes(selectedWeek))) {
            setSelectedWeek(uniqueWeeks[0]);
        }
    }, [leads, expenses, selectedBranch]);

    // Filtering logic
    const filteredLeads = leads.filter(lead => {
        if (selectedBranch && lead.branch_id !== selectedBranch) return false;
        if (omsetSource === "closing") {
            if (lead.status?.name?.toLowerCase() !== "closing") return false;
        }
        
        // Time Period Filter
        if (timeFilterType === "month") {
            if (!lead.created_at || getYearMonth(lead.created_at) !== selectedMonth) return false;
        } else if (timeFilterType === "week") {
            if (!lead.created_at || getStartOfWeekDate(lead.created_at) !== selectedWeek) return false;
        }
        
        return true;
    });

    const filteredExpenses = expenses.filter(expense => {
        if (selectedBranch && expense.branch_id !== selectedBranch) return false;
        
        // Time Period Filter
        if (timeFilterType === "month") {
            if (!expense.created_at || getYearMonth(expense.created_at) !== selectedMonth) return false;
        } else if (timeFilterType === "week") {
            if (!expense.created_at || getStartOfWeekDate(expense.created_at) !== selectedWeek) return false;
        }
        
        return true;
    });

    // Calculations
    const omset = filteredLeads.reduce((sum, lead) => sum + (lead.nominal || 0), 0);
    const hpp = manualHpp === "" ? 0 : Number(manualHpp);
    const grossProfit = omset - hpp;
    const grossProfitMargin = omset > 0 ? (grossProfit / omset) * 100 : 0;
    
    const opex = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const netProfit = grossProfit - opex;
    const netProfitMargin = omset > 0 ? (netProfit / omset) * 100 : 0;

    // Group expenses by category for breakdown
    const expensesByCategory: { [key: string]: number } = {};
    filteredExpenses.forEach(exp => {
        const catName = exp.expense_categories?.name || "Lain-lain";
        expensesByCategory[catName] = (expensesByCategory[catName] || 0) + exp.amount;
    });

    // Sort categories by amount descending
    const sortedExpenseCategories = Object.entries(expensesByCategory)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

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
        <div className="max-w-7xl mx-auto space-y-8 pb-16 text-zinc-850">
            {/* Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 font-sans">Laporan Keuangan</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Ikhtisar laba rugi, omset penjualan, HPP, opex, dan laba bersih operasional.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>Data Real-time Sistem</span>
                </div>
            </div>

            {/* Filter and Input Controls Panel */}
            <div className="bg-white border border-zinc-200/80 shadow-sm rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <SlidersHorizontal size={16} className="text-zinc-500" />
                    <h3 className="font-bold text-sm text-zinc-950 uppercase tracking-wider">Parameter Laporan</h3>
                </div>
                
                {/* Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
                            <option value="closing">Hanya Leads Status Closing (Standar)</option>
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

                    {/* Dynamic Detail Selector */}
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

                    {/* Manual HPP Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign size={14} className="text-zinc-400" />
                            Input HPP Manual (COGS)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400 select-none">
                                Rp
                            </span>
                            <input
                                type="number"
                                min="0"
                                value={manualHpp}
                                onChange={(e) => setManualHpp(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="0"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Financial Report Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                
                {/* Laporan Laba Rugi (Income Statement) Card */}
                <div className="lg:col-span-3 bg-white border border-zinc-200 shadow-xl rounded-2xl p-8 space-y-6">
                    {/* Header Statement */}
                    <div className="border-b border-zinc-200 pb-5 text-center md:text-left">
                        <h2 className="text-xl font-black text-zinc-950 tracking-tight font-sans">LAPORAN LABA RUGI</h2>
                        <p className="text-[10px] text-zinc-450 font-bold tracking-wider uppercase mt-1 leading-relaxed">
                            Periode: {
                                timeFilterType === "all" 
                                    ? "Semua Waktu (Akumulasi)" 
                                    : timeFilterType === "month" 
                                        ? `Bulan ${formatMonthLabel(selectedMonth)}` 
                                        : `Minggu: ${formatWeekLabel(selectedWeek)}`
                            } <br className="md:hidden" />
                            <span className="hidden md:inline"> | </span>
                            Cabang: {selectedBranch ? branches.find(b => b.id === selectedBranch)?.name : "Semua Cabang"}
                        </p>
                    </div>

                    {/* Financial Figures Table */}
                    <div className="space-y-4">
                        {/* Omset / Pendapatan */}
                        <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                            <div className="space-y-0.5">
                                <span className="font-semibold text-sm text-zinc-700">Total Pendapatan (Omset)</span>
                                <p className="text-[10px] text-zinc-400 leading-none">Dari nominal leads ({filteredLeads.length} transaksi)</p>
                            </div>
                            <span className="font-extrabold text-base text-zinc-950">
                                Rp {omset.toLocaleString("id-ID")}
                            </span>
                        </div>

                        {/* HPP */}
                        <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                            <div className="space-y-0.5">
                                <span className="font-semibold text-sm text-zinc-700">Harga Pokok Penjualan (HPP)</span>
                                <p className="text-[10px] text-zinc-400 leading-none">Biaya langsung produk/layanan (input manual)</p>
                            </div>
                            <span className="font-extrabold text-base text-zinc-500">
                                - Rp {hpp.toLocaleString("id-ID")}
                            </span>
                        </div>

                        {/* Gross Profit */}
                        <div className="flex justify-between items-center py-3.5 bg-zinc-50 rounded-xl px-4 my-2 border border-zinc-100">
                            <div className="space-y-0.5">
                                <span className="font-bold text-sm text-zinc-800">Laba Kotor (Gross Profit)</span>
                                <div className="flex items-center gap-1">
                                    <Percent size={11} className="text-zinc-400" />
                                    <span className="text-[10px] text-zinc-500 font-semibold">Margin: {grossProfitMargin.toFixed(1)}%</span>
                                </div>
                            </div>
                            <span className="font-extrabold text-lg text-zinc-950">
                                Rp {grossProfit.toLocaleString("id-ID")}
                            </span>
                        </div>

                        {/* Opex */}
                        <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                            <div className="space-y-0.5">
                                <span className="font-semibold text-sm text-zinc-700">Biaya Operasional (Opex)</span>
                                <p className="text-[10px] text-zinc-400 leading-none">Berdasarkan tabel pengeluaran ({filteredExpenses.length} transaksi)</p>
                            </div>
                            <span className="font-extrabold text-base text-red-650">
                                - Rp {opex.toLocaleString("id-ID")}
                            </span>
                        </div>

                        {/* Net Profit */}
                        <div className={`flex justify-between items-center py-5 rounded-2xl px-5 mt-4 border-2 ${
                            netProfit >= 0 
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950" 
                                : "bg-red-50/70 border-red-200 text-red-950"
                        }`}>
                            <div className="space-y-0.5">
                                <span className="font-black text-base uppercase tracking-tight">Laba Bersih (Net Profit)</span>
                                <div className="flex items-center gap-1.5">
                                    {netProfit >= 0 ? (
                                        <TrendingUp size={14} className="text-emerald-600" />
                                    ) : (
                                        <TrendingDown size={14} className="text-red-650" />
                                    )}
                                    <span className="text-xs font-bold">
                                        Margin Bersih: {netProfitMargin.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-2xl font-black tracking-tight ${
                                    netProfit >= 0 ? "text-emerald-800" : "text-red-750"
                                }`}>
                                    Rp {netProfit.toLocaleString("id-ID")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytical breakdown and Visualizations */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Visual Segmented Progress Bar */}
                    <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <PieChart size={16} className="text-zinc-500" />
                            <h3 className="font-bold text-sm text-zinc-950 tracking-tight">Alokasi Pendapatan</h3>
                        </div>

                        {omset > 0 ? (
                            <div className="space-y-4">
                                <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                                    <div 
                                        className="bg-zinc-400 h-full transition-all duration-500" 
                                        style={{ width: `${Math.min(100, Math.max(0, (hpp / omset) * 100))}%` }}
                                        title={`HPP: ${((hpp / omset) * 100).toFixed(1)}%`}
                                    />
                                    <div 
                                        className="bg-red-500 h-full transition-all duration-500" 
                                        style={{ width: `${Math.min(100, Math.max(0, (opex / omset) * 100))}%` }}
                                        title={`Opex: ${((opex / omset) * 100).toFixed(1)}%`}
                                    />
                                    <div 
                                        className="bg-emerald-500 h-full transition-all duration-500 flex-1" 
                                        style={{ width: `${Math.min(100, Math.max(0, (netProfit / omset) * 100))}%` }}
                                        title={`Net Profit: ${((netProfit / omset) * 100).toFixed(1)}%`}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold">
                                    <div className="flex items-center gap-1">
                                        <div className="h-2 w-2 rounded-full bg-zinc-400" />
                                        <span>HPP ({((hpp / omset) * 100).toFixed(1)}%)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="h-2 w-2 rounded-full bg-red-500" />
                                        <span>Opex ({((opex / omset) * 100).toFixed(1)}%)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span>Net Profit ({((netProfit / omset) * 100).toFixed(1)}%)</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-zinc-400 italic">Masukkan atau filter data leads untuk memicu diagram alokasi.</p>
                        )}
                    </div>

                    {/* Expense Breakdown Card */}
                    <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={16} className="text-zinc-500" />
                            <h3 className="font-bold text-sm text-zinc-950 tracking-tight">Rincian Opex Kategori</h3>
                        </div>

                        {sortedExpenseCategories.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic">Tidak ada pengeluaran operasional terdaftar untuk periode/cabang ini.</p>
                        ) : (
                            <div className="space-y-3.5">
                                {sortedExpenseCategories.map(cat => {
                                    const percent = opex > 0 ? (cat.amount / opex) * 100 : 0;
                                    return (
                                        <div key={cat.name} className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-zinc-700">{cat.name}</span>
                                                <span className="font-bold text-zinc-950">
                                                    Rp {cat.amount.toLocaleString("id-ID")}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-250 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-zinc-800 h-full rounded-full transition-all duration-300"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
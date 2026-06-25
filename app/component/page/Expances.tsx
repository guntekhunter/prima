"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getBranch, getExpenseCategories, getExpenses } from "@/app/fetch/get/fetch";
import { createExpense } from "@/app/fetch/add/fetch";
import {
    DollarSign,
    Building,
    FileText,
    Layers,
    Plus,
    Loader2,
    CheckCircle,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    TrendingUp
} from "lucide-react";

type Branch = {
  id: string;
  name: string;
};

type ExpenseCategory = {
  id: string;
  name: string;
};

type Expense = {
  id: string;
  category_id: string;
  description: string;
  amount: number;
  branch_id: string;
  created_by: string;
  created_at: string;
  expense_categories?: { name: string } | null;
  branches?: { name: string } | null;
};

export default function Expances() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [categoryId, setCategoryId] = useState("");
    const [branchId, setBranchId] = useState("");
    const [amount, setAmount] = useState<number | "">("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    
    // Status states
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

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

                const [branchesRes, categoriesRes, expensesData] = await Promise.all([
                    getBranch(),
                    getExpenseCategories(),
                    getExpenses(),
                ]);

                setBranches(branchesRes?.data || []);
                setCategories(categoriesRes?.data || []);
                setExpenses(expensesData || []);
            } catch (err) {
                console.error("Error initializing expenses page:", err);
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!user) return;

        if (!categoryId || !branchId || amount === "" || amount <= 0 || !description) {
            setErrorMessage("Semua field wajib diisi dan nominal harus lebih besar dari 0");
            return;
        }

        setSubmitting(true);

        try {
            const response = await createExpense({
                category_id: categoryId,
                branch_id: branchId,
                amount: Number(amount),
                description,
                created_by: user.id,
            });

            if (response.success && response.expense) {
                // Find matching category and branch names to update the UI
                const selectedCategory = categories.find(c => c.id === categoryId);
                const selectedBranch = branches.find(b => b.id === branchId);

                const newExpenseObj: Expense = {
                    ...response.expense,
                    expense_categories: selectedCategory ? { name: selectedCategory.name } : null,
                    branches: selectedBranch ? { name: selectedBranch.name } : null
                };

                setExpenses(prev => [newExpenseObj, ...prev]);
                setCategoryId("");
                setBranchId("");
                setAmount("");
                setDescription("");
                setSuccessMessage("Pengeluaran berhasil ditambahkan!");
                setTimeout(() => setSuccessMessage(""), 5000);
            } else {
                setErrorMessage("Gagal menambahkan pengeluaran");
            }
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.response?.data?.error || "Gagal menambahkan pengeluaran");
        } finally {
            setSubmitting(false);
        }
    }

    // Stats calculations
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const countTransactions = expenses.length;
    const averageExpense = countTransactions > 0 ? totalExpenses / countTransactions : 0;

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center text-sm font-medium text-zinc-500">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-950" />
                    <span>Memuat data pengeluaran...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-16 text-zinc-800">
            {/* Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Manajemen Pengeluaran</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Kelola dan lacak seluruh pengeluaran operasional prima Anda.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Sistem Terhubung ke Database</span>
                </div>
            </div>

            {/* Stats Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-zinc-200/80 shadow-sm rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <DollarSign className="h-24 w-24 text-zinc-950" />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Pengeluaran</span>
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-3xl font-bold text-zinc-950 tracking-tight">
                            Rp {totalExpenses.toLocaleString("id-ID")}
                        </span>
                        <p className="text-xs text-zinc-500 mt-1">Total akumulasi transaksi</p>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200/80 shadow-sm rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <FileText className="h-24 w-24 text-zinc-950" />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jumlah Transaksi</span>
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600">
                            <ArrowUpRight size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-3xl font-bold text-zinc-950 tracking-tight">
                            {countTransactions}
                        </span>
                        <p className="text-xs text-zinc-500 mt-1">Transaksi pengeluaran tercatat</p>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200/80 shadow-sm rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Building className="h-24 w-24 text-zinc-950" />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Rata-Rata Transaksi</span>
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600">
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-3xl font-bold text-zinc-950 tracking-tight">
                            Rp {Math.round(averageExpense).toLocaleString("id-ID")}
                        </span>
                        <p className="text-xs text-zinc-500 mt-1">Rata-rata biaya per transaksi</p>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {successMessage && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2 animate-fadeIn">
                    <CheckCircle className="text-emerald-600" size={18} />
                    {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="text-red-600" size={18} />
                    {errorMessage}
                </div>
            )}

            {/* Form and List Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Form Card */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-950 tracking-tight">Tambah Pengeluaran</h2>
                        <p className="text-xs text-zinc-500 mt-1">Input data pengeluaran baru di bawah ini.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Category Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers size={14} className="text-zinc-400" />
                                Kategori Pengeluaran
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
                                required
                            >
                                <option value="">Pilih Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Branch Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Building size={14} className="text-zinc-400" />
                                Cabang (Branch)
                            </label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
                                required
                            >
                                <option value="">Pilih Cabang</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                <DollarSign size={14} className="text-zinc-400" />
                                Nominal (Rupiah)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400 select-none font-geist">
                                    Rp
                                </span>
                                <input
                                    type="number"
                                    min="1"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                                    placeholder="0"
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all font-semibold"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText size={14} className="text-zinc-400" />
                                Deskripsi / Catatan
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Masukkan rincian atau keterangan pengeluaran..."
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all min-h-[100px] resize-y"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer mt-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Plus size={16} />
                                    <span>Simpan Pengeluaran</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Expense List Card */}
                <div className="lg:col-span-2 bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-950 tracking-tight">Daftar Pengeluaran Terbaru</h2>
                        <p className="text-xs text-zinc-500 mt-1">Daftar transaksi pengeluaran operasional yang terdaftar.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr className="border-b border-zinc-200 text-zinc-400 uppercase font-semibold">
                                    <th className="py-3 px-3 w-[20%]">Tanggal</th>
                                    <th className="py-3 px-3 w-[20%]">Kategori</th>
                                    <th className="py-3 px-3 w-[20%]">Cabang</th>
                                    <th className="py-3 px-3 w-[20%] text-right">Nominal</th>
                                    <th className="py-3 px-3 w-[20%]">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-zinc-400 font-medium">
                                            Belum ada data pengeluaran terdaftar.
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map((exp) => (
                                        <tr key={exp.id} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="py-3.5 px-3 text-zinc-500 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={13} className="text-zinc-400" />
                                                    {new Date(exp.created_at).toLocaleDateString("id-ID", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-3 font-semibold text-zinc-900">
                                                {exp.expense_categories?.name || "Lain-lain"}
                                            </td>
                                            <td className="py-3.5 px-3 text-zinc-600">
                                                {exp.branches?.name || "Utama"}
                                            </td>
                                            <td className="py-3.5 px-3 text-right font-bold text-zinc-950">
                                                Rp {(exp.amount || 0).toLocaleString("id-ID")}
                                            </td>
                                            <td className="py-3.5 px-3 text-zinc-500 max-w-[150px] truncate" title={exp.description}>
                                                {exp.description}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
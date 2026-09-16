"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Wallet,
} from "lucide-react";

type Profile = {
  id: string;
  full_name: string;
  email: string;
};

type CashAdvanceRecord = {
  id: string;
  user_id: string;
  nominal: number;
  ket: string;
  status: string;
  created_at: string;
  profiles?: { full_name: string; email: string } | null;
};

export default function CashAdvance() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<CashAdvanceRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState("");
  const [nominal, setNominal] = useState<number | "">("");
  const [ket, setKet] = useState("");

  // Feedback
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/");
          return;
        }

        setUser(user);

        const [profilesRes, recordsRes] = await Promise.all([
          axios.get("/api/get/profiles"),
          axios.get("/api/cash-advance"),
        ]);

        setProfiles(profilesRes.data || []);
        setRecords(recordsRes.data || []);
      } catch (err) {
        console.error("Error initializing cash advance page:", err);
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

    if (!selectedUserId || nominal === "" || nominal <= 0 || !ket) {
      setErrorMessage("Semua field wajib diisi dan nominal harus lebih dari 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post("/api/cash-advance", {
        user_id: selectedUserId,
        nominal: Number(nominal),
        ket,
      });

      setRecords((prev) => [res.data, ...prev]);
      setSuccessMessage("Cash advance berhasil ditambahkan!");
      setTimeout(() => setSuccessMessage(""), 4000);

      // Reset form
      setSelectedUserId("");
      setNominal("");
      setKet("");
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error || "Gagal menyimpan cash advance."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const prev = records;
    setRecords((r) => r.filter((rec) => rec.id !== id));
    try {
      await axios.delete(`/api/cash-advance?id=${id}`);
    } catch (err) {
      setRecords(prev);
      alert("Gagal menghapus data.");
    }
  }

  const [filterUserId, setFilterUserId] = useState("");

  const filteredRecords = records.filter((rec) => {
    if (filterUserId && rec.user_id !== filterUserId) return false;
    return true;
  });

  const totalNominal = filteredRecords.reduce(
    (sum, rec) => sum + (rec.nominal || 0),
    0
  );

  const formatRp = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

  const getUserName = (rec: CashAdvanceRecord) =>
    rec.profiles?.full_name ||
    profiles.find((p) => p.id === rec.user_id)?.full_name ||
    "—";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-medium text-zinc-500">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-950" />
          <span>Memuat data cash advance...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">
            Cash Advance
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Kelola pengajuan uang muka karyawan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 text-sm font-medium bg-white text-zinc-700 outline-none focus:border-zinc-400"
          >
            <option value="">Semua Karyawan</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Card — Total only */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Pengajuan
            </span>
            <h3 className="text-2xl font-black text-zinc-950 tracking-tight">
              {formatRp(totalNominal)}
            </h3>
            <p className="text-[11px] text-zinc-400">{filteredRecords.length} record</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center">
            <Wallet size={18} className="text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Feedback */}
      {successMessage && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-sm">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Add Form */}
      <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-black uppercase tracking-wider text-zinc-950 border-b border-zinc-100 pb-3 flex items-center gap-2">
          <Plus size={15} />
          Tambah Cash Advance
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Nama Pemohon (user dropdown) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Nama Pemohon
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
            >
              <option value="">Pilih Pemohon</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Nominal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Nominal (Rp)
            </label>
            <input
              type="number"
              value={nominal}
              onChange={(e) =>
                setNominal(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="0"
              min={0}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all"
            />
          </div>

          {/* Keterangan */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Keterangan
            </label>
            <textarea
              value={ket}
              onChange={(e) => setKet(e.target.value)}
              placeholder="Keperluan penggunaan uang muka..."
              rows={2}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Tambah Cash Advance
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Records Table */}
      <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-950">
            Riwayat Cash Advance
          </h2>
          <span className="text-xs text-zinc-400 font-semibold uppercase">
            {filteredRecords.length} data
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">
            Belum ada data cash advance.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Nama Pemohon
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Keterangan
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Nominal
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-5 py-3 w-[5%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-zinc-900">
                      {getUserName(rec)}
                    </td>
                    <td className="px-5 py-3 text-zinc-500 max-w-[220px] truncate">
                      {rec.ket}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-zinc-900">
                      {formatRp(rec.nominal)}
                    </td>
                    <td className="px-5 py-3 text-center text-zinc-400 text-xs">
                      {new Date(rec.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

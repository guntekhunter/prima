"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBranch, getRoles } from "@/app/fetch/get/fetch";
import { supabase } from "@/lib/supabase";
import axios from "axios";
import {
    User,
    Mail,
    Lock,
    Building,
    Shield,
    Loader2,
    UserPlus,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff
} from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const [branchId, setBranchId] = useState("");
    const [roles, setRoles] = useState<any[]>([]);
    const [roleId, setRoleId] = useState("");

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

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

                const resBranch = await getBranch();
                setBranches(resBranch?.data || []);

                const resRoles = await getRoles();
                setRoles(resRoles?.data || []);
            } catch (err) {
                console.error("Error loading register page data:", err);
            } finally {
                setPageLoading(false);
            }
        }
        init();
    }, [router]);

    async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");

        try {
            const selectedRole = roles.find((r) => r.id === roleId);
            const roleName = selectedRole ? selectedRole.name : "";

            const res = await axios.post("/api/auth/register", {
                email,
                password,
                fullName,
                branchId,
                roleId,
                roleName,
            });

            if (res.data.error) {
                throw new Error(res.data.error);
            }

            setSuccessMsg(`Akun untuk "${fullName}" berhasil dibuat!`);
            
            // Reset form fields
            setFullName("");
            setEmail("");
            setPassword("");
            setBranchId("");
            setRoleId("");

        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || err.message || "Gagal membuat akun.");
        } finally {
            setLoading(false);
        }
    }

    if (pageLoading) {
        return (
            <div className="flex h-64 items-center justify-center text-sm font-medium text-zinc-500">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-950" />
                    <span>Memuat form pendaftaran...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-16 text-zinc-850">
            {/* Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 font-sans">
                        Tambah Staf / Pengguna
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Daftarkan akun staf baru dan tentukan penugasan cabang serta perannya.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold shadow-sm">
                    <Shield size={14} className="text-zinc-500" />
                    <span>Administrator Only</span>
                </div>
            </div>

            {/* Success and Error Alerts */}
            {successMsg && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-xl shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-medium">{successMsg}</span>
                </div>
            )}

            {errorMsg && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-950 p-4 rounded-xl shadow-sm">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                    <span className="text-sm font-medium">{errorMsg}</span>
                </div>
            )}

            {/* Registration Form Card */}
            <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-8">
                <form onSubmit={handleRegister} className="space-y-6">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                            <User size={14} className="text-zinc-400" />
                            Nama Lengkap (Full Name)
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Agung Haeruddin"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all font-medium"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Mail size={14} className="text-zinc-400" />
                            Alamat Email (Email Address)
                        </label>
                        <input
                            type="email"
                            placeholder="Contoh: agung@guntek.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all font-medium"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Lock size={14} className="text-zinc-400" />
                            Kata Sandi (Password)
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Minimal 6 karakter"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-4 pr-11 py-3 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all font-medium font-mono"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-950 transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Branch */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Building size={14} className="text-zinc-400" />
                                Penugasan Cabang (Branch)
                            </label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all font-medium"
                                required
                            >
                                <option value="">Pilih Cabang</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Role */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Shield size={14} className="text-zinc-400" />
                                Peran / Hak Akses (Role)
                            </label>
                            <select
                                value={roleId}
                                onChange={(e) => setRoleId(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-zinc-950 focus:outline-none transition-all font-medium"
                                required
                            >
                                <option value="">Pilih Peran</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-zinc-950 hover:bg-zinc-900 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm text-sm"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Mendaftarkan staff...</span>
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4" />
                                <span>Daftarkan Akun Baru</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
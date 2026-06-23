"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBranch, getRoles } from "@/app/fetch/get/fetch";
import axios from "axios";

export default function RegisterPage() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [branches, setBranches] = useState<any[]>([]);
    const [branchId, setBranchId] = useState("");
    const [roles, setRoles] = useState<any[]>([]);
    const [roleId, setRoleId] = useState("");

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function init() {
            const resBranch = await getBranch();
            setBranches(resBranch?.data || []);

            const resRoles = await getRoles();
            setRoles(resRoles?.data || []);
        }
        init();
    }, []);

    async function handleRegister(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        try {
            setLoading(true);

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

            alert("Registration successful! New user added.");

            // Reset form fields
            setFullName("");
            setEmail("");
            setPassword("");
            setBranchId("");
            setRoleId("");

        } catch (err: any) {
            alert(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-3xl mx-auto">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        Tambah User Baru
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Create a new staff account and assign a branch.
                    </p>
                </div>

                <div className="bg-white rounded-xl border shadow-sm p-6">

                    <form
                        onSubmit={handleRegister}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Full Name
                            </label>

                            <input
                                type="text"
                                placeholder="Agung Haeruddin"
                                value={fullName}
                                onChange={(e) =>
                                    setFullName(e.target.value)
                                }
                                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Email
                            </label>

                            <input
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Password
                            </label>



                            <input
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Branch
                            </label>

                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">
                                    Select Branch
                                </option>

                                {branches.map((branch) => (
                                    <option
                                        key={branch.id}
                                        value={branch.id}
                                    >
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Role
                            </label>

                            <select
                                value={roleId}
                                onChange={(e) => setRoleId(e.target.value)}
                                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">
                                    Select Role
                                </option>

                                {roles.map((role) => (
                                    <option
                                        key={role.id}
                                        value={role.id}
                                    >
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? "Creating Account..." : "Register"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
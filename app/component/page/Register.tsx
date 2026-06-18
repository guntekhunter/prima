"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    async function handleRegister(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        try {
            setLoading(true);

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) {
                throw error;
            }

            alert(
                "Registration successful. Check your email verification if enabled."
            );

            router.push("/login");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-center mb-2">
                    Create Account
                </h1>

                <p className="text-center text-gray-500 mb-8">
                    Register your CRM account
                </p>

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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? "Creating Account..." : "Register"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push("/login")}
                        className="text-blue-600 hover:underline"
                    >
                        Already have an account? Login
                    </button>
                </div>
            </div>
        </div>
    );
}
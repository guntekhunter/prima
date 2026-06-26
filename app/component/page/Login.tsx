"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin() {
        const { error } =
            await supabase.auth.signInWithPassword({
                email,
                password,
            });

        if (error) {
            alert(error.message);
            return;
        }

        router.refresh();
        router.push("/report");
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="hidden lg:flex bg-blue-600 items-center justify-center">
                <div className="max-w-md text-white">
                    <h1 className="text-5xl font-bold mb-4">
                        CRM Dashboard
                    </h1>

                    <p className="text-lg opacity-90">
                        Track leads, customers, sales, and branch
                        performance in one place.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-center p-6 bg-white">
                <div className="w-full max-w-md">
                    <h2 className="text-3xl font-bold mb-2">
                        Welcome Back
                    </h2>

                    <p className="text-gray-500 mb-8">
                        Login to continue
                    </p>

                    <div className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border rounded-lg px-4 py-3"
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border rounded-lg px-4 py-3"
                        />

                        <button
                            onClick={handleLogin}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
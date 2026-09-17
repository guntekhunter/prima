"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
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
    <div className="min-h-screen grid lg:grid-cols-2 text-black">
      <div className="hidden lg:flex bg-[#86986A] items-center justify-center">
        <div className="max-w-md text-white">
          <span className="font-semibold text-lg tracking-tight text-zinc-950 flex items-center gap-2">
            <Image alt="" src="/logo.png" width={200} height={200}></Image>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>

          <p className="text-gray-500 mb-8">Login to continue</p>

          <div className="space-y-4 text-gray-500">
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
              className="w-full bg-[#86986A] text-white py-3 rounded-lg hover:bg-[#98b16e]"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Menu,
    Home,
    User,
    FileText,
    Settings,
    LogOut,
    BarChart3,
    X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Sidebar({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const isAuthPage = pathname === "/login";

    const menuItems = [
        { name: "Input Leads", href: "/leads-input", icon: Home },
        { name: "Pengeluaran", href: "/pengeluaran", icon: FileText },
        { name: "Laporan Keuangan", href: "/report", icon: BarChart3 },
        { name: "Tambah Pengguna", href: "/register", icon: User },
    ];

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert(error.message);
        } else {
            router.push("/login");
        }
    };

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-zinc-50">

            {/* ─────────────────────────────────────────
                MOBILE: Fixed top navbar
            ───────────────────────────────────────── */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-zinc-200 shadow-sm flex items-center justify-between px-4 print:hidden">
                {/* Brand */}
                <span className="font-semibold text-base tracking-tight text-zinc-950 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">
                        P
                    </span>
                    Prima
                </span>

                {/* Hamburger */}
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>
            </header>

            {/* ─────────────────────────────────────────
                MOBILE: Drawer backdrop
            ───────────────────────────────────────── */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ─────────────────────────────────────────
                MOBILE: Slide-in drawer
            ───────────────────────────────────────── */}
            <aside
                className={`
                    md:hidden
                    fixed top-0 left-0 z-50
                    h-full w-72
                    bg-white border-r border-zinc-200 shadow-xl
                    flex flex-col
                    transition-transform duration-300 ease-in-out
                    print:hidden
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* Drawer header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                    <span className="font-semibold text-lg tracking-tight text-zinc-950 flex items-center gap-2">
                        <span className="h-6 w-6 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">
                            P
                        </span>
                        Prima
                    </span>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Drawer menu */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`
                                    flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-sm
                                    ${isActive
                                        ? "bg-zinc-950 text-white font-semibold"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                    }
                                `}
                            >
                                <Icon size={18} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Drawer footer */}
                <div className="p-3 border-t border-zinc-100">
                    <button
                        onClick={() => { setMobileOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-all duration-200 text-sm"
                    >
                        <LogOut size={18} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* ─────────────────────────────────────────
                DESKTOP: Floating sidebar
            ───────────────────────────────────────── */}
            <aside
                className={`
                    hidden md:flex
                    m-2
                    bg-white
                    border border-zinc-200/80
                    shadow-sm
                    rounded-2xl
                    transition-all
                    duration-300
                    flex-col
                    relative
                    ${collapsed ? "w-16" : "w-64"}
                    print:hidden
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                    {!collapsed && (
                        <span className="font-semibold text-lg tracking-tight text-zinc-950 flex items-center gap-2">
                            <span className="h-6 w-6 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">
                                P
                            </span>
                            Prima
                        </span>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors ${collapsed ? "mx-auto" : ""}`}
                        title={collapsed ? "Expand Menu" : "Collapse Menu"}
                    >
                        <Menu size={18} />
                    </button>
                </div>

                {/* Menu */}
                <nav className="flex-1 p-2 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200
                                    ${isActive
                                        ? "bg-zinc-100 text-zinc-950 font-medium"
                                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                                    }
                                    ${collapsed ? "justify-center" : ""}
                                `}
                            >
                                <Icon size={18} className={isActive ? "text-zinc-950" : "text-zinc-500"} />
                                {!collapsed && <span className="text-sm">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-2 border-t border-zinc-100">
                    <button
                        onClick={handleLogout}
                        className={`
                            w-full flex items-center gap-3 p-2.5 rounded-xl
                            hover:bg-red-50/80 text-zinc-500 hover:text-red-600
                            transition-all duration-200
                            ${collapsed ? "justify-center" : ""}
                        `}
                    >
                        <LogOut size={18} />
                        {!collapsed && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* ─────────────────────────────────────────
                Main Content Area
            ───────────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto p-6 pt-20 md:pt-6 print:p-0 print:overflow-visible print:bg-white">
                {children}
            </main>
        </div>
    );
}
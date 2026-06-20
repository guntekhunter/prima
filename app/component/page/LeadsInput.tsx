"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Lead = {
    id: number;
    name: string;
    phone_number: string;
    address: string;
    nominal: number;
    branches?: { name: string } | { name: string }[] | null;
    status?: { name: string } | { name: string }[] | null;
    platform?: { name: string } | { name: string }[] | null;
};

type Branch = {
    id: string;
    name: string;
};

type StatusOption = {
    id: string;
    name: string;
};

type PlatformOption = {
    id: string;
    name: string;
};

const getRelationName = (rel: any) => {
    if (!rel) return "";
    if (Array.isArray(rel)) return rel[0]?.name || "";
    return rel.name || "";
};

export default function Dashboard() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [statuses, setStatuses] = useState<StatusOption[]>([]);
    const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [branchId, setBranchId] = useState("");
    const [statusId, setStatusId] = useState("");
    const [address, setAddress] = useState("");
    const [nominal, setNominal] = useState<number | "">("");
    const [platformId, setPlatformId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function fetchLeads() {
        const { data, error } = await supabase
            .from("leads")
            .select(`
                id,
                name,
                phone_number,
                address,
                nominal,
                branches (name),
                status (name),
                platform (name)
            `)
            .order("id", { ascending: false });

        if (error) {
            console.error("Error fetching leads:", error);
        } else {
            setLeads((data as any) || []);
        }
    }

    useEffect(() => {
        async function init() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            setUser(user);

            let branchesData: Branch[] = [];
            let statusesData: StatusOption[] = [];
            let platformsData: PlatformOption[] = [];

            try {
                const [branchesRes, statusRes, platformRes] = await Promise.all([
                    fetch("/api/branches").then((res) => res.json()),
                    fetch("/api/status").then((res) => res.json()),
                    fetch("/api/platform").then((res) => res.json())
                ]);

                if (Array.isArray(branchesRes)) branchesData = branchesRes;
                else console.error("Error fetching branches:", branchesRes);

                if (Array.isArray(statusRes)) statusesData = statusRes;
                else console.error("Error fetching status:", statusRes);

                if (Array.isArray(platformRes)) platformsData = platformRes;
                else console.error("Error fetching platform:", platformRes);
            } catch (err) {
                console.error("Error fetching API data:", err);
            }

            setBranches(branchesData);
            setStatuses(statusesData);
            setPlatforms(platformsData);

            await fetchLeads();

            setLoading(false);
        }

        init();
    }, [router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;

        if (!name || !phoneNumber || !branchId || !statusId || !address || nominal === "" || !platformId) {
            alert("All fields are required");
            return;
        }

        setSubmitting(true);

        const { error } = await supabase.from("leads").insert({
            name,
            phone_number: phoneNumber,
            branch_id: branchId,
            user_id: user.id,
            status_id: statusId,
            address,
            nominal: Number(nominal),
            platform_id: platformId,
        });

        setSubmitting(false);

        if (error) {
            alert("Failed to add lead: " + error.message);
            console.error(error);
        } else {
            // Reset form fields
            setName("");
            setPhoneNumber("");
            setBranchId("");
            setStatusId("");
            setAddress("");
            setNominal("");
            setPlatformId("");
            // Refresh leads list
            await fetchLeads();
        }
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="text-[.6rem]">
            <h1 className="font-bold mb-2 text-[.8rem]">
                Dashboard
            </h1>

            {/* Input Form under the header looking like Excel cells */}
            <form onSubmit={handleSubmit} className="mb-4 overflow-x-auto rounded border border-zinc-300 bg-white">
                <table className="w-full border-collapse text-[.6rem]">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-300">
                            <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[14%]">Name</th>
                            <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[14%]">Phone Number</th>
                            <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[14%]">Branch</th>
                            <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[14%]">Status</th>
                            <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[14%]">Address</th>
                            <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[12%]">Nominal</th>
                            <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[12%]">Platform</th>
                            <th className="px-2 py-1.5 text-center font-semibold text-zinc-600 w-[6%]">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="divide-x divide-zinc-300">
                            <td className="p-0 relative focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-600 focus-within:z-10">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter Name"
                                    className="w-full h-8 px-2 bg-transparent outline-none border-none text-[.6rem]"
                                    required
                                />
                            </td>
                            <td className="p-0 relative focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-600 focus-within:z-10">
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Phone Number"
                                    className="w-full h-8 px-2 bg-transparent outline-none border-none text-[.6rem]"
                                    required
                                />
                            </td>
                            <td className="p-0 relative focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-600 focus-within:z-10">
                                <select
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                    className="w-full h-8 px-2 bg-transparent outline-none border-none text-[.6rem] cursor-pointer"
                                    required
                                >
                                    <option value="" className="text-zinc-400">Select Branch</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id} className="text-black">
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="p-0 relative focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-600 focus-within:z-10">
                                <select
                                    value={statusId}
                                    onChange={(e) => setStatusId(e.target.value)}
                                    className="w-full h-8 px-2 bg-transparent outline-none border-none text-[.6rem] cursor-pointer"
                                    required
                                >
                                    <option value="" className="text-zinc-400">Select Status</option>
                                    {statuses.map((s) => (
                                        <option key={s.id} value={s.id} className="text-black">
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="p-0 relative focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-600 focus-within:z-10">
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Address"
                                    className="w-full h-8 px-2 bg-transparent outline-none border-none text-[.6rem]"
                                    required
                                />
                            </td>
                            <td className="p-0 relative focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-600 focus-within:z-10">
                                <input
                                    type="number"
                                    value={nominal}
                                    onChange={(e) => setNominal(e.target.value === "" ? "" : Number(e.target.value))}
                                    placeholder="Nominal"
                                    className="w-full h-8 px-2 bg-transparent outline-none border-none text-[.6rem]"
                                    required
                                />
                            </td>
                            <td className="p-0 relative focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-600 focus-within:z-10">
                                <select
                                    value={platformId}
                                    onChange={(e) => setPlatformId(e.target.value)}
                                    className="w-full h-8 px-2 bg-transparent outline-none border-none text-[.6rem] cursor-pointer"
                                    required
                                >
                                    <option value="" className="text-zinc-400">Select Platform</option>
                                    {platforms.map((p) => (
                                        <option key={p.id} value={p.id} className="text-black">
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="p-0">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full h-8 bg-green-700 hover:bg-green-800 text-white font-bold text-[.6rem] transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? "..." : "ADD"}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </form>

            <div className="overflow-x-auto rounded-lg bg-white border border-zinc-200/80">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 font-light">
                            <th className="p-3 text-left">Name</th>
                            <th className="p-3 text-left">Phone Number</th>
                            <th className="p-3 text-left">Branch</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Address</th>
                            <th className="p-3 text-left">Nominal</th>
                            <th className="p-3 text-left">Platform</th>
                            <th className="p-3 text-left">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {leads.map((item) => (
                            <tr
                                key={item.id}
                                className="border-t"
                            >
                                <td className="p-3">{item.name}</td>
                                <td className="p-3">
                                    {item.phone_number}
                                </td>
                                <td className="p-3">{getRelationName(item.branches)}</td>
                                <td className="p-3">{getRelationName(item.status)}</td>
                                <td className="p-3">{item.address}</td>
                                <td className="p-3">
                                    Rp{" "}
                                    {item.nominal?.toLocaleString(
                                        "id-ID"
                                    )}
                                </td>
                                <td className="p-3">
                                    {getRelationName(item.platform)}
                                </td>
                                <td className="p-3">
                                    {/* Action button column */}
                                </td>
                            </tr>
                        ))}

                        {leads.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="p-6 text-center"
                                >
                                    No data found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
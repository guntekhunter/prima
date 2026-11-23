"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  getBranch,
  getLeads,
  getPlatform,
  getStatus,
  getInvoices,
} from "@/app/fetch/get/fetch";
import { createLead } from "@/app/fetch/add/fetch";
import { deleteLead } from "@/app/fetch/delete/fetch";
import { updateLead } from "@/app/fetch/update/fetch";
import axios from "axios";
import {
  Loader2,
  Users,
  TrendingUp,
  DollarSign,
  Layers,
} from "lucide-react";

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

// Helper to format ISO timestamp to YYYY-MM-DD for date input
const toDateInputValue = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Format raw number to Indonesian money format with dot separator (e.g. 200000000 -> "200.000.000")
const formatMoneyDisplay = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === "") return "";
  const numStr = String(val).replace(/\D/g, "");
  if (!numStr) return "";
  return new Intl.NumberFormat("id-ID").format(Number(numStr));
};

// Parse formatted money string back to raw integer for database
const parseMoneyRaw = (val: string): number => {
  const digitsOnly = val.replace(/\D/g, "");
  return digitsOnly ? Number(digitsOnly) : 0;
};

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [branchId, setBranchId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [address, setAddress] = useState("");
  const [nominal, setNominal] = useState<number | "">("");
  const [platformId, setPlatformId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterBranch, setFilterBranch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

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

        try {
          const res = await axios.post("/api/auth/me", { userId: user.id });
          const profile = res.data?.profile;
          const roleName =
            (profile?.roles as any)?.name?.toLowerCase() ||
            (profile?.roles as any[])?.[0]?.name?.toLowerCase() ||
            profile?.role?.toLowerCase() ||
            "";
          if (!roleName.includes("admin")) {
            router.push("/report");
            return;
          }
        } catch (err) {
          console.error("Failed to load profile", err);
        }

        setUser(user);

        const [branchesRes, statusRes, platformRes, invoicesRes, leadsRes] =
          await Promise.all([
            getBranch(),
            getStatus(),
            getPlatform(),
            getInvoices(),
            getLeads(),
          ]);

        setBranches(branchesRes?.data || []);
        setStatuses(statusRes?.data || []);
        setPlatforms(platformRes?.data || []);
        setInvoices(invoicesRes || []);
        setLeads(leadsRes || []);
      } catch (err) {
        console.error("Error initializing dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (
      !name ||
      !phoneNumber ||
      !branchId ||
      !address ||
      nominal === "" ||
      !platformId
    ) {
      alert("All fields are required");
      return;
    }

    setSubmitting(true);

    try {
      const createdAtISO = date
        ? new Date(date + "T00:00:00Z").toISOString()
        : new Date().toISOString();

      const newLead = await createLead({
        name,
        phone_number: phoneNumber,
        branch_id: branchId,
        address,
        nominal: Number(nominal),
        platform_id: platformId,
        user_id: user.id,
        created_at: createdAtISO,
      });

      // Update local state with the new lead including created_at and relation names
      const branchObj = branches.find((b) => b.id === branchId);
      const platformObj = platforms.find((p) => p.id === platformId);

      const enhancedLead: Lead = {
        ...newLead,
        created_at: newLead.created_at || createdAtISO,
        branches: branchObj ? { name: branchObj.name } : newLead.branches,
        platform: platformObj ? { name: platformObj.name } : newLead.platform,
      };

      setLeads((prev) => [enhancedLead, ...prev]);

      const selectedStatus = statuses.find((s) => s.id === statusId);
      if (selectedStatus?.name?.toLowerCase() === "closing") {
        router.push(`/invoice?lead_id=${newLead.id}`);
      } else {
        setName("");
        setPhoneNumber("");
        setBranchId("");
        setStatusId("");
        setAddress("");
        setNominal("");
        setPlatformId("");
        setDate(new Date().toISOString().split("T")[0]);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add lead");
    } finally {
      setSubmitting(false);
    }
  }

  const handleDelete = async (id: number) => {
    const previousLeads = leads;

    setLeads((prev) => prev.filter((l) => l.id !== id));

    try {
      await deleteLead(id);
    } catch (error) {
      setLeads(previousLeads);
      console.error(error);
      alert("Failed to delete lead");
    }
  };

  const handleUpdate = async (id: number, field: keyof Lead, value: any) => {
    const previous = leads;

    // Optimistic update
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id
          ? {
              ...lead,
              [field]: value,
            }
          : lead,
      ),
    );

    try {
      const updated = await updateLead(id, {
        [field]: value,
      });

      // Sync with server response
      setLeads((prev) =>
        prev.map((lead) => (lead.id === id ? { ...lead, ...updated } : lead)),
      );
    } catch (e) {
      console.error("Update failed:", e);
      setLeads(previous);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      let match = true;
      if (filterBranch && l.branch_id !== filterBranch) match = false;
      if (filterMonth && l.created_at) {
        if (!l.created_at.startsWith(filterMonth)) match = false;
      }
      return match;
    });
  }, [leads, filterBranch, filterMonth]);

  // Stats Calculations
  const totalLeads = filteredLeads.length;
  const totalOmset = filteredLeads.reduce(
    (sum, l) => sum + (l.nominal || 0),
    0,
  );

  const filteredLeadIds = new Set(filteredLeads.map((l) => String(l.id)));
  const totalMargin = invoices
    .filter((inv) => filteredLeadIds.has(String(inv.lead_id)))
    .reduce((sum, inv) => sum + (inv.margin || 0), 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-medium text-zinc-500">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-950" />
          <span>Memuat dashboard leads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5 text-gray-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">
            Project Costing
          </h1>
        </div>
        <div className="items-center gap-4 md:grid md:grid-cols-3 grid grid-cols-2">
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 text-sm font-medium bg-white text-zinc-700 outline-none focus:border-zinc-400"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 text-sm font-medium bg-white text-zinc-700 outline-none focus:border-zinc-400"
          />
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold shadow-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Leads Tracker</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Project
            </span>
            <h3 className="text-2xl font-black text-zinc-950 tracking-tight">
              {totalLeads}
            </h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500">
            <Users size={18} />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Omset
            </span>
            <h3 className="text-2xl font-black text-zinc-950 tracking-tight">
              Rp {totalOmset.toLocaleString("id-ID")}
            </h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Margin
            </span>
            <h3 className="text-2xl font-black text-zinc-950 tracking-tight">
              Rp {totalMargin.toLocaleString("id-ID")}
            </h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500">
            <DollarSign size={18} />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-zinc-500" />
            <h3 className="font-bold text-sm text-zinc-950 uppercase tracking-wider">
              Interactive Spreadsheet
            </h3>
          </div>
          <span className="text-[10px] text-zinc-400 font-semibold uppercase">
            Kolom Date (created_at) dapat diedit langsung & update otomatis ke grafik
          </span>
        </div>

        <div className="text-[.6rem]">
          <form
            onSubmit={handleSubmit}
            className="mb-4 overflow-x-auto rounded-xl border border-zinc-300 bg-white"
          >
            <table className="w-full border-collapse text-[.6rem]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-300">
                  <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[12%]">
                    Date
                  </th>
                  <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[14%]">
                    Name
                  </th>
                  <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[12%]">
                    Phone Number
                  </th>
                  <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[12%]">
                    Branch
                  </th>
                  <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[16%]">
                    Address
                  </th>
                  <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[12%]">
                    Nominal
                  </th>
                  <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[12%]">
                    Platform
                  </th>
                  <th className="px-2 py-1.5 text-center font-semibold text-zinc-600 w-[10%]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-700">
                {/* Input Row */}
                <tr className="divide-x divide-zinc-300 bg-white">
                  <td className="p-0">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-8 px-2 outline-none bg-zinc-50/50"
                    />
                  </td>

                  <td className="p-0">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Name"
                      className="w-full h-8 px-2 outline-none"
                    />
                  </td>

                  <td className="p-0">
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full h-8 px-2 outline-none"
                    />
                  </td>

                  <td className="p-0">
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full h-8 px-2"
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-0">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Address"
                      className="w-full h-8 px-2 outline-none"
                    />
                  </td>

                  <td className="p-0">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatMoneyDisplay(nominal)}
                      onChange={(e) => {
                        const raw = parseMoneyRaw(e.target.value);
                        setNominal(e.target.value === "" ? "" : raw);
                      }}
                      placeholder="Nominal (contoh: 200.000.000)"
                      className="w-full h-8 px-2 outline-none font-medium"
                    />
                  </td>

                  <td className="p-0">
                    <select
                      value={platformId}
                      onChange={(e) => setPlatformId(e.target.value)}
                      className="w-full h-8 px-2"
                    >
                      <option value="">Select Platform</option>
                      {platforms.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-0">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-8 bg-zinc-950 hover:bg-zinc-800 text-white font-bold transition-colors cursor-pointer"
                    >
                      {submitting ? "..." : "ADD"}
                    </button>
                  </td>
                </tr>

                {/* Leads Rows */}
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="divide-x divide-zinc-300 border-t border-zinc-300 bg-white hover:bg-zinc-50"
                  >
                    {/* Editable Date Column */}
                    <td className="p-0">
                      <input
                        type="date"
                        defaultValue={toDateInputValue(lead.created_at)}
                        className="w-full h-8 px-2 bg-transparent outline-none focus:bg-white"
                        onChange={(e) => {
                          const newDateStr = e.target.value;
                          if (newDateStr) {
                            const newISO = new Date(newDateStr + "T00:00:00Z").toISOString();
                            handleUpdate(lead.id, "created_at", newISO);
                          }
                        }}
                      />
                    </td>

                    <td>
                      <input
                        defaultValue={lead.name}
                        className="w-full h-8 px-2 bg-transparent outline-none focus:bg-white"
                        onBlur={(e) =>
                          handleUpdate(lead.id, "name", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        defaultValue={lead.phone_number}
                        className="w-full h-8 px-2 bg-transparent outline-none focus:bg-white"
                        onBlur={(e) =>
                          handleUpdate(lead.id, "phone_number", e.target.value)
                        }
                      />
                    </td>

                    <td className="p-0">
                      <select
                        value={lead.branch_id}
                        className="w-full h-full px-2 py-1 bg-transparent outline-none"
                        onChange={async (e) => {
                          const newBranchId = e.target.value;
                          const selectedBranch = branches.find(
                            (b) => b.id === newBranchId,
                          );

                          setLeads((prev) =>
                            prev.map((l) =>
                              l.id === lead.id
                                ? {
                                    ...l,
                                    branch_id: newBranchId,
                                    branches: {
                                      name: selectedBranch?.name || "",
                                    },
                                  }
                                : l,
                            ),
                          );

                          try {
                            await updateLead(lead.id, {
                              branch_id: newBranchId,
                            });
                          } catch (error) {
                            console.error(error);
                          }
                        }}
                      >
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <input
                        defaultValue={lead.address}
                        className="w-full h-8 px-2 bg-transparent outline-none focus:bg-white"
                        onBlur={(e) =>
                          handleUpdate(lead.id, "address", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        defaultValue={formatMoneyDisplay(lead.nominal)}
                        key={`nominal-${lead.id}-${lead.nominal}`}
                        className="w-full h-8 px-2 bg-transparent outline-none focus:bg-white font-medium"
                        onFocus={(e) => {
                          // Allow clean editing or keep formatted
                          e.target.select();
                        }}
                        onChange={(e) => {
                          const formatted = formatMoneyDisplay(e.target.value);
                          e.target.value = formatted;
                        }}
                        onBlur={(e) => {
                          const rawNumber = parseMoneyRaw(e.target.value);
                          handleUpdate(lead.id, "nominal", rawNumber);
                        }}
                      />
                    </td>

                    <td className="p-0">
                      <select
                        value={lead.platform_id}
                        className="w-full h-full px-2 py-1 bg-transparent outline-none"
                        onChange={(e) =>
                          handleUpdate(lead.id, "platform_id", e.target.value)
                        }
                      >
                        {platforms.map((platform) => (
                          <option key={platform.id} value={platform.id}>
                            {platform.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-0">
                      <div className="flex items-center justify-center gap-1 h-8 px-1">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/invoice?lead_id=${lead.id}`)
                          }
                          className="px-1.5 py-0.5 rounded text-[.6rem] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 cursor-pointer whitespace-nowrap"
                        >
                          RAB
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(lead.id)}
                          className="px-1.5 py-0.5 rounded text-[.6rem] font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer whitespace-nowrap"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </form>
        </div>
      </div>
    </div>
  );
}

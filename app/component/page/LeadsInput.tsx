"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getBranch, getLeads, getPlatform, getStatus } from "@/app/fetch/get/fetch";
import { createLead } from "@/app/fetch/add/fetch";
import { deleteLead } from "@/app/fetch/delete/fetch";
import { updateLead } from "@/app/fetch/update/fetch";

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

        const [branchesRes, statusRes, platformRes] = await Promise.all([
          getBranch(),
          getStatus(),
          getPlatform(),
        ]);

        console.log("branchesRes", branchesRes);
        console.log("statusRes", statusRes);
        console.log("platformRes", platformRes);

        setBranches(branchesRes?.data || []);
        setStatuses(statusRes?.data || []);
        setPlatforms(platformRes?.data || []);

        const leadsRes = await getLeads();
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
      !statusId ||
      !address ||
      nominal === "" ||
      !platformId
    ) {
      alert("All fields are required");
      return;
    }

    setSubmitting(true);

    try {
      const newLead = await createLead({
        name,
        phone_number: phoneNumber,
        branch_id: branchId,
        status_id: statusId,
        address,
        nominal: Number(nominal),
        platform_id: platformId,
        user_id: user.id,
      });

      setLeads((prev) => [newLead, ...prev]);
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

  const handleUpdate = async (
    id: number,
    field: keyof Lead,
    value: any
  ) => {
    const previous = leads;

    // optimistic update
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id
          ? {
            ...lead,
            [field]: value,
          }
          : lead
      )
    );

    try {
      const updated = await updateLead(id, {
        [field]: value,
      });

      // sync with server response (IMPORTANT)
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id ? { ...lead, ...updated } : lead
        )
      );
    } catch (e) {
      setLeads(previous);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="text-[.6rem]">
      <h1 className="font-bold mb-2 text-[.8rem]">Dashboard</h1>

      {/* Input Form under the header looking like Excel cells */}
      <form
        onSubmit={handleSubmit}
        className="mb-4 overflow-x-auto rounded border border-zinc-300 bg-white"
      >
        <table className="w-full border-collapse text-[.6rem]">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-300">
              <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[14%]">
                Name
              </th>
              <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[14%]">
                Phone Number
              </th>
              <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[14%]">
                Branch
              </th>
              <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[14%]">
                Status
              </th>
              <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[14%]">
                Address
              </th>
              <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[12%]">
                Nominal
              </th>
              <th className="border-r border-zinc-300 px-2 py-1.5 text-left font-semibold text-zinc-600 w-[12%]">
                Platform
              </th>
              <th className="px-2 py-1.5 text-center font-semibold text-zinc-600 w-[6%]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Input Row */}
            <tr className="divide-x divide-zinc-300 bg-white">
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
                <select
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                  className="w-full h-8 px-2"
                >
                  <option value="">Select Status</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
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
                  type="number"
                  value={nominal}
                  onChange={(e) =>
                    setNominal(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Nominal"
                  className="w-full h-8 px-2 outline-none"
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
                  className="w-full h-8 bg-green-700 text-white"
                >
                  {submitting ? "..." : "ADD"}
                </button>
              </td>
            </tr>

            {/* Leads Rows */}
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="divide-x divide-zinc-300 border-t border-zinc-300 bg-white hover:bg-zinc-50"
              >
                <td>
                  <input
                    defaultValue={lead.name}
                    onBlur={(e) =>
                      handleUpdate(
                        lead.id,
                        "name",
                        e.target.value
                      )
                    }
                  />
                </td>

                <td>
                  <input
                    defaultValue={lead.phone_number}
                    onBlur={(e) =>
                      handleUpdate(
                        lead.id,
                        "phone_number",
                        e.target.value
                      )
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
                        (b) => b.id === newBranchId
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
                            : l
                        )
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
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="p-0">
                  <select
                    value={lead.status_id}
                    className="w-full h-full px-2 py-1 bg-transparent outline-none"
                    onChange={(e) =>
                      handleUpdate(
                        lead.id,
                        "status_id",
                        e.target.value
                      )
                    }
                  >
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <input
                    defaultValue={lead.address}
                    onBlur={(e) =>
                      handleUpdate(
                        lead.id,
                        "address",
                        e.target.value
                      )
                    }
                  />

                </td>

                <td>

                  <input
                    type="number"
                    defaultValue={lead.nominal}
                    onBlur={(e) =>
                      handleUpdate(
                        lead.id,
                        "nominal",
                        Number(e.target.value)
                      )
                    }
                  />
                </td>


                <td className="p-0">
                  <select
                    value={lead.platform_id}
                    className="w-full h-full px-2 py-1 bg-transparent outline-none"
                    onChange={(e) =>
                      handleUpdate(
                        lead.id,
                        "platform_id",
                        e.target.value
                      )
                    }
                  >
                    {platforms.map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <button
                    type="button"
                    onClick={() => handleDelete(lead.id)}
                    className="text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </form>
    </div >
  );
}

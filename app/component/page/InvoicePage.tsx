"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Printer, Save, CheckCircle } from "lucide-react";
import { getBranch } from "@/app/fetch/get/fetch";
import axios from "axios";

type Branch = {
  id: string;
  name: string;
};

type InvoiceItem = {
  id?: string | number;
  product_code: string;
  product_name: string;
  qty: number;
  branch_id: string;
  prize: number;
  total: number;
};

type Lead = {
  id: string;
  customer_id: string;
  name: string;
  phone_number: string;
  address: string;
  nominal: number;
  branch_id: string;
  status_id: string;
  platform_id: string;
  branches?: { name: string } | null;
  status?: { name: string } | null;
};

export default function InvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get("lead_id");

  const [lead, setLead] = useState<Lead | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const generateInvoiceNumber = (lId: string) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    // Using the lead's unique UUID segment ensures absolute uniqueness across concurrent inputs
    const shortLeadId = lId ? lId.split("-")[0].toUpperCase() : Math.random().toString(36).substring(2, 10).toUpperCase();
    return `INV/${yyyy}${mm}${dd}/${shortLeadId}`;
  };

  useEffect(() => {
    if (!leadId) {
      router.push("/leads-input");
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);

        // Fetch branches
        const branchRes = await getBranch();
        const branchList = branchRes?.data || [];
        setBranches(branchList);

        // Fetch lead details
        const leadRes = await axios.get(`/api/leads/${leadId}`);
        const leadData = leadRes.data;
        setLead(leadData);

        // Try to fetch existing invoice for this lead
        const invoiceRes = await axios.get(`/api/invoices?lead_id=${leadId}`);
        if (invoiceRes.data) {
          const inv = invoiceRes.data;
          setInvoiceNumber(inv.invoice_number);
          setCreatedAt(new Date(inv.created_at).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }));
          // Map backend items to frontend items
          const mappedItems = (inv.invoice_items || []).map((item: any) => ({
            id: item.id,
            product_code: item.product_code,
            product_name: item.product_name,
            qty: item.qty, // using qty
            branch_id: item.branch_id,
            prize: item.prize,
            total: item.total,
          }));
          setItems(mappedItems);
          setIsSaved(true);
        } else {
          // Pre-populate new invoice
          setInvoiceNumber(generateInvoiceNumber(leadId || ""));
          setCreatedAt(new Date().toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }));
          setIsSaved(false);

          // Smart pre-population of one invoice item using lead details
          setItems([
            {
              product_code: leadData.nominal > 0 ? "PRD-CLOS" : "PRD-01",
              product_name: `Layanan Closing - ${leadData.name}`,
              qty: 1,
              branch_id: leadData.branch_id || "",
              prize: leadData.nominal || 0,
              total: leadData.nominal || 0,
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching invoice data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [leadId, router]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_code: "",
        product_name: "",
        qty: 1,
        branch_id: lead?.branch_id || "",
        prize: 0,
        total: 0,
      },
    ]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, val: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: val };
        if (field === "qty" || field === "prize") {
          const qty = field === "qty" ? Number(val) : Number(item.qty);
          const prize = field === "prize" ? Number(val) : Number(item.prize);
          updated.total = qty * prize;
        }
        return updated;
      })
    );
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      alert("At least one invoice item is required.");
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    setSuccessMessage("");

    try {
      const payload = {
        costumer_id: lead.customer_id,
        lead_id: lead.id,
        invoice_number: invoiceNumber,
        items: items,
      };

      const res = await axios.post("/api/invoices", payload);
      if (res.data) {
        setIsSaved(true);
        const grandTotal = calculateSubtotal();
        setLead(prev => prev ? { ...prev, nominal: grandTotal } : null);
        setSuccessMessage("Invoice successfully saved to Database!");
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save invoice. Please check DB permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-medium text-zinc-500">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent"></div>
          <span>Loading invoice editor...</span>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
        Lead data not found.
      </div>
    );
  }

  const subtotal = calculateSubtotal();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 text-zinc-800">
      {/* CSS overrides for print */}
      <style>{`
        @media print {
          /* Hide sidebar and navigation */
          aside, nav, header, .no-print {
            display: none !important;
          }
          /* Reset container margins & sizing */
          body {
            background: white !important;
            color: black !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          .invoice-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
          }
          /* Hide editing controls */
          .action-btn-col, .add-item-row, .delete-header, .delete-cell {
            display: none !important;
          }
          /* Style inputs to appear as normal text */
          input, select {
            border: none !important;
            background: transparent !important;
            outline: none !important;
            padding: 0 !important;
            pointer-events: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            color: black !important;
            box-shadow: none !important;
            width: auto !important;
            min-width: 0 !important;
            appearance: none !important;
            -webkit-appearance: none;
            -moz-appearance: none;
          }
          select {
            background-image: none !important;
          }
        }
      `}</style>

      {/* Header Panel */}
      <div className="flex items-center justify-between no-print border-b border-zinc-200 pb-4">
        <button
          onClick={() => router.push("/leads-input")}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950 font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Leads
        </button>

        <div className="flex items-center gap-2">
          {isSaved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <CheckCircle size={12} />
              Saved to Database
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200 animate-pulse">
              Unsaved Draft
            </span>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="no-print p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="text-emerald-600" size={18} />
          {successMessage}
        </div>
      )}

      {/* Main Grid: Left is Invoice Sheet, Right is Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Invoice Card Sheet */}
        <div className="lg:col-span-3 bg-white border border-zinc-200 shadow-xl rounded-2xl p-8 invoice-card">
          {/* Top Invoice Branding */}
          <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-zinc-150 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white text-sm font-bold">P</div>
                <span className="font-bold text-xl tracking-tight text-zinc-950">PRIMA</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                Prima Business and Consulting Inc.<br />
                Branch Office: {lead.branches?.name || "Main Branch"}
              </p>
            </div>

            <div className="md:text-right space-y-1">
              <h2 className="font-extrabold text-2xl tracking-tight text-zinc-900">INVOICE</h2>
              <div className="text-xs text-zinc-600">
                <span className="font-medium text-zinc-400">Invoice No:</span>{" "}
                <span className="font-semibold text-zinc-850 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 select-all">
                  {invoiceNumber}
                </span>
              </div>
              <div className="text-xs text-zinc-600">
                <span className="font-medium text-zinc-400">Date:</span> {createdAt}
              </div>
            </div>
          </div>

          {/* Client & Billing Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-xs">
            <div>
              <h3 className="font-semibold text-zinc-400 uppercase tracking-wider mb-2">Billed To</h3>
              <div className="text-sm font-bold text-zinc-900 mb-1">{lead.name}</div>
              <div className="text-zinc-600 mb-1">{lead.phone_number}</div>
              <div className="text-zinc-600 max-w-xs leading-relaxed">{lead.address}</div>
            </div>

            <div className="md:text-right">
              <h3 className="font-semibold text-zinc-400 uppercase tracking-wider mb-2">Payment Details</h3>
              <div className="text-zinc-600">Bank Transfer</div>
              <div className="text-zinc-900 font-medium">BCA Account: 123-456-7890</div>
              <div className="text-zinc-600">A/N PT Prima Sukses</div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-300 text-zinc-400 uppercase font-semibold">
                  <th className="py-2.5 pr-2 w-[15%]">Code</th>
                  <th className="py-2.5 px-2 w-[35%]">Product / Service Name</th>
                  <th className="py-2.5 px-2 w-[20%]">Branch</th>
                  <th className="py-2.5 px-2 w-[8%] text-center">Qty</th>
                  <th className="py-2.5 px-2 w-[12%] text-right">Unit Price</th>
                  <th className="py-2.5 pl-2 w-[12%] text-right">Total</th>
                  <th className="py-2.5 pl-2 w-[5%] text-center delete-header no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-zinc-50/50">
                    <td className="py-2.5 pr-2">
                      <input
                        type="text"
                        value={item.product_code}
                        onChange={(e) => updateItem(index, "product_code", e.target.value)}
                        placeholder="e.g. PRD-01"
                        className="w-full bg-transparent border-b border-zinc-100 hover:border-zinc-300 focus:border-zinc-950 focus:outline-none py-1"
                        required
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={item.product_name}
                        onChange={(e) => updateItem(index, "product_name", e.target.value)}
                        placeholder="Product Description"
                        className="w-full bg-transparent border-b border-zinc-100 hover:border-zinc-300 focus:border-zinc-950 focus:outline-none py-1"
                        required
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <select
                        value={item.branch_id}
                        onChange={(e) => updateItem(index, "branch_id", e.target.value)}
                        className="w-full bg-transparent border-b border-zinc-100 hover:border-zinc-300 focus:border-zinc-950 focus:outline-none py-1"
                        required
                      >
                        <option value="">Select Branch</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(index, "qty", Number(e.target.value))}
                        className="w-12 text-center bg-transparent border-b border-zinc-100 hover:border-zinc-300 focus:border-zinc-950 focus:outline-none py-1"
                        required
                      />
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        min="0"
                        value={item.prize}
                        onChange={(e) => updateItem(index, "prize", Number(e.target.value))}
                        className="w-20 text-right bg-transparent border-b border-zinc-100 hover:border-zinc-300 focus:border-zinc-950 focus:outline-none py-1"
                        required
                      />
                    </td>
                    <td className="py-2.5 pl-2 text-right font-semibold text-zinc-900">
                      Rp {(item.total || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 pl-2 text-center delete-cell no-print">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                        title="Remove Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Add Item Trigger */}
                <tr className="add-item-row no-print">
                  <td colSpan={7} className="py-4">
                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 font-semibold transition-colors"
                    >
                      <Plus size={14} />
                      Add Item Row
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pricing Totals & Signatures */}
          <div className="border-t border-zinc-200 pt-6 flex flex-col md:flex-row justify-between gap-8">
            <div className="max-w-xs text-[10px] text-zinc-400 space-y-1">
              <h4 className="font-bold text-zinc-500 uppercase">Terms & Conditions</h4>
              <p>Payment is due within 14 days of invoice date. Please include invoice number in payment description details.</p>
              <p>Thank you for choosing Prima Inc. We value your business!</p>
            </div>

            <div className="w-full md:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Tax / VAT (0%)</span>
                <span>Rp 0</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold text-sm text-zinc-950">
                <span>Grand Total</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel Side Panel */}
        <div className="space-y-4 no-print actions-panel">
          <div className="bg-white border border-zinc-200 shadow-lg rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-zinc-950 tracking-tight">Invoice Actions</h3>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save Invoice"}
            </button>

            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Printer size={14} />
              Print / Save PDF
            </button>
          </div>

          <div className="bg-zinc-100/50 border border-zinc-200/60 rounded-2xl p-4 text-[10px] text-zinc-500 space-y-2">
            <div className="font-bold text-zinc-700">Quick Instructions</div>
            <p>1. Pre-populated fields derive from the Closing Lead details automatically.</p>
            <p>2. The invoice number is automatically generated and guaranteed unique.</p>
            <p>3. You can add extra product items or modify product names, codes, quantities, and pricing.</p>
            <p>4. Clicking <strong>Save Invoice</strong> commits the record to Database.</p>
            <p>5. Clicking <strong>Print / Save PDF</strong> opens the system print window. We've optimized the layout for printable paper sizes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

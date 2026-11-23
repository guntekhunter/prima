import { createSupabaseAdmin } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdmin();

    const body = await req.json();

    const {
      name,
      phone_number,
      branch_id,
      address,
      nominal,
      platform_id,
      user_id,
      created_at,
    } = body;

    if (
      !name ||
      !phone_number ||
      !branch_id ||
      !address ||
      typeof nominal !== "number" ||
      !platform_id ||
      !user_id
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // =========================
    // Cari customer berdasarkan no_hp
    // =========================
    const { data: existingCustomer } = await supabase
      .from("customer")
      .select("id")
      .eq("no_hp", phone_number)
      .maybeSingle();

    let customerId: string;

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customer")
        .insert({
          no_hp: phone_number,
          name,
          address,
        })
        .select("id")
        .single();

      if (customerError) {
        return NextResponse.json(
          { error: customerError.message },
          { status: 500 },
        );
      }

      customerId = newCustomer.id;
    }

    // =========================
    // Buat lead
    // =========================
    const leadInsertPayload: any = {
      customer_id: customerId,
      name,
      phone_number,
      branch_id,
      address,
      nominal,
      platform_id,
      user_id,
    };
    if (created_at) {
      leadInsertPayload.created_at = created_at;
    }

    const { data, error } = await supabase
      .from("leads")
      .insert([leadInsertPayload])
      .select(
        `
        id,
        customer_id,
        name,
        phone_number,
        address,
        nominal,
        branch_id,
        platform_id,
        created_at,
        branches(name),
        platform(name)
      `,
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // =========================
    // Insert/update invoice with total_prize = nominal
    // =========================
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("lead_id", data.id)
      .maybeSingle();

    if (existingInvoice) {
      const { error: invoiceUpdateError } = await supabase
        .from("invoices")
        .update({ total_prize: nominal })
        .eq("id", existingInvoice.id);

      if (invoiceUpdateError) {
        console.error(
          "Error updating invoice total_prize:",
          invoiceUpdateError,
        );
      }
    } else {
      // Hitung total data leads
      const { count, error: countError } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      if (countError) {
        console.error("Error counting leads:", countError);
      } else {
        const invoiceNumber = `INV-${String(count ?? 0).padStart(6, "0")}`;

        const { error: invoiceInsertError } = await supabase
          .from("invoices")
          .insert({
            lead_id: data.id,
            costumer_id: customerId,
            invoice_number: invoiceNumber,
            total_prize: nominal,
          });

        if (invoiceInsertError) {
          console.error("Error inserting invoice:", invoiceInsertError);
        }
      }
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createSupabaseAdmin();

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("leads").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

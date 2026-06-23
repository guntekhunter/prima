import { createSupabaseAdmin } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("lead_id");
    const id = searchParams.get("id");

    let query = supabase.from("invoices").select(`
      id,
      costumer_id,
      lead_id,
      invoice_number,
      created_at,
      invoice_items (
        id,
        created_at,
        invoice_id,
        product_code,
        product_name,
        qty,
        branch_id,
        prize,
        total
      )
    `);

    if (id) {
      query = query.eq("id", id);
    } else if (leadId) {
      query = query.eq("lead_id", leadId);
    } else {
      return NextResponse.json(
        { error: "Either id or lead_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const body = await req.json();

    const { costumer_id, lead_id, invoice_number, items } = body;

    if (!costumer_id || !lead_id || !invoice_number || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing required fields or invalid items array" },
        { status: 400 }
      );
    }

    // Check if invoice already exists for this lead_id
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("lead_id", lead_id)
      .maybeSingle();

    let invoiceId: string | number;

    if (existingInvoice) {
      invoiceId = existingInvoice.id;

      // Update invoice header
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          costumer_id,
          invoice_number,
        })
        .eq("id", invoiceId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Delete existing invoice items for clean overwrite
      const { error: deleteError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoiceId);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    } else {
      // Create new invoice header
      const { data: newInvoice, error: createError } = await supabase
        .from("invoices")
        .insert({
          costumer_id,
          lead_id,
          invoice_number,
        })
        .select("id")
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      invoiceId = newInvoice.id;
    }

    // Insert invoice items
    if (items.length > 0) {
      const itemsPayload = items.map((item: any) => ({
        invoice_id: invoiceId,
        product_code: item.product_code || "",
        product_name: item.product_name || "",
        qty: Number(item.qty) || 0,
        branch_id: item.branch_id || null,
        prize: Number(item.prize) || 0,
        total: Number(item.total) || (Number(item.qty) || 0) * (Number(item.prize) || 0),
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsPayload);

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    // Retrieve full invoice for response
    const { data: fullInvoice, error: fetchError } = await supabase
      .from("invoices")
      .select(`
        id,
        costumer_id,
        lead_id,
        invoice_number,
        created_at,
        invoice_items (
          id,
          created_at,
          invoice_id,
          product_code,
          product_name,
          qty,
          branch_id,
          prize,
          total
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(fullInvoice);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

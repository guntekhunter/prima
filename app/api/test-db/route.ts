import { createSupabaseAdmin } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    
    console.log("API: Testing invoices query...");
    const { data: invoices, error: invError } = await supabase.from('invoices').select('*').limit(1);
    
    console.log("API: Testing invoice_items query...");
    const { data: items, error: itemsError } = await supabase.from('invoice_items').select('*').limit(1);

    return NextResponse.json({
      invoices: { data: invoices, error: invError },
      invoice_items: { data: items, error: itemsError }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

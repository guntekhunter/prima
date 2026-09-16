import { createSupabaseAdmin } from "@/utils/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("invoices")
    .select(`
      id,
      margin,
      total_prize,
      created_at,
      lead_id,
      leads ( branch_id )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invoices:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? []);
}

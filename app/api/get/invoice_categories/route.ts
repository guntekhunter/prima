import { createSupabaseAdmin } from "@/utils/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("invoice_category")
    .select("id, category_name, position")
    .order("position", { ascending: true });

  if (error) {
    return Response.json({ error }, { status: 500 });
  }

  return Response.json(data);
}

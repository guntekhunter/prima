import { createSupabaseAdmin } from "@/utils/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("expenses")
    .select(`
      id,
      category_id,
      description,
      amount,
      branch_id,
      created_by,
      created_at,
      expense_categories(name),
      branches(name)
    `)
    .order("id", { ascending: false });

  if (error) {
    console.error("Error fetching expenses:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? []);
}

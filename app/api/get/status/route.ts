import { createSupabaseAdmin } from "@/utils/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase.from("status").select("id, name");

  if (error) {
    return Response.json({ error }, { status: 500 });
  }

  return Response.json(data); // 🔥 langsung array
}

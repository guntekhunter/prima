import { createSupabaseAdmin } from "@/utils/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase.from("roles").select("id, name");

  if (error) {
    console.error("Error fetching roles from database:", error);
    
    // Fallback list of roles in case of database permission/existence issues.
    // This allows the UI to render the options and the admin to complete the setup.
    const fallbackRoles = [
      { id: "super_admin", name: "super_admin" },
      { id: "branch_admin", name: "branch_admin" },
      { id: "surveyor", name: "surveyor" },
      { id: "HR", name: "HR" }
    ];
    
    return Response.json(fallbackRoles);
  }

  // If table is empty, return fallback roles so the user has choices
  if (!data || data.length === 0) {
    const fallbackRoles = [
      { id: "super_admin", name: "super_admin" },
      { id: "branch_admin", name: "branch_admin" },
      { id: "surveyor", name: "surveyor" },
      { id: "HR", name: "HR" }
    ];
    return Response.json(fallbackRoles);
  }

  return Response.json(data);
}

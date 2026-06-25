import { createSupabaseAdmin } from "@/utils/supabase/admin";

export async function GET() {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
        .from("leads")
        .select(`
            id,
            name,
            phone_number,
            address,
            nominal,
            branch_id,
            status_id,
            platform_id,
            created_at,
            branches(name),
            status(name),
            platform(name)
        `)
        .order("id", { ascending: false });

    if (error) {
        console.error("Error fetching leads:", error);

        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }

    return Response.json(data ?? []);
}
import { createSupabaseAdmin } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createSupabaseAdmin();

        const { id } = await params;
        const body = await req.json();

        const { data, error } = await supabase
            .from("leads")
            .update(body)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}
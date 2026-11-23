import { createSupabaseAdmin } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createSupabaseAdmin();
        const { id } = await params;

        const { data, error } = await supabase
            .from("leads")
            .select(`
                id,
                customer_id,
                name,
                phone_number,
                address,
                nominal,
                branch_id,
                status_id,
                platform_id,
                branches(name),
                status(name),
                platform(name)
            `)
            .eq("id", id)
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

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createSupabaseAdmin();

        const { id } = await params;
        const body = await req.json();

        // Ensure created_at format is properly handled if provided as YYYY-MM-DD
        const updateData = { ...body };
        if (updateData.created_at && typeof updateData.created_at === "string") {
            if (/^\d{4}-\d{2}-\d{2}$/.test(updateData.created_at)) {
                updateData.created_at = new Date(updateData.created_at + "T00:00:00Z").toISOString();
            }
        }

        const { data, error } = await supabase
            .from("leads")
            .update(updateData)
            .eq("id", id)
            .select(`
                id,
                customer_id,
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
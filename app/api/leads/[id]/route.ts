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
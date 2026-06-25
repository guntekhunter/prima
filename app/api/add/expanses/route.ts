import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/utils/supabase/admin";

export async function POST(req: Request) {
    try {
        const supabase = createSupabaseAdmin();

        const body = await req.json();

        const {
            category_id,
            description,
            amount,
            branch_id,
            created_by,
        } = body;

        // Validation
        if (!category_id) {
            return NextResponse.json(
                { error: "Category is required" },
                { status: 400 }
            );
        }

        if (!amount || Number(amount) <= 0) {
            return NextResponse.json(
                { error: "Amount must be greater than 0" },
                { status: 400 }
            );
        }

        if (!branch_id) {
            return NextResponse.json(
                { error: "Branch is required" },
                { status: 400 }
            );
        }

        if (!created_by) {
            return NextResponse.json(
                { error: "Created by is required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("expenses")
            .insert({
                category_id,
                description,
                amount,
                branch_id,
                created_by,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating expense:", error);

            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                expense: data,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
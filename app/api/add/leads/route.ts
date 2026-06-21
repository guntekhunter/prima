import { createSupabaseAdmin } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdmin();

    const body = await req.json();

    const {
      name,
      phone_number,
      branch_id,
      status_id,
      address,
      nominal,
      platform_id,
      user_id,
    } = body;

    if (
      !name ||
      !phone_number ||
      !branch_id ||
      !status_id ||
      !address ||
      typeof nominal !== "number" ||
      !platform_id ||
      !user_id
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          name,
          phone_number,
          branch_id,
          status_id,
          address,
          nominal,
          platform_id,
          user_id,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

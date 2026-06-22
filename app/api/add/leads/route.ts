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
      .select(`
  id,
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

export async function DELETE(req: Request) {
  try {
    const supabase = createSupabaseAdmin();

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
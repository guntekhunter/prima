import { createSupabaseAdmin } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("adfance")
      .select(
        `
        id,
        user_id,
        nominal,
        ket,
        created_at,
        profiles ( *, roles(name) )
      `,
      )
      .order("created_at", { ascending: false });

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

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const body = await req.json();
    const { user_id, nominal, ket } = body;

    if (!user_id || !nominal || !ket) {
      return NextResponse.json(
        { error: "user_id, nominal, dan ket wajib diisi." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("adfance")
      .insert({
        user_id,
        nominal: Number(nominal),
        ket,
      })
      .select(
        `
        id,
        user_id,
        nominal,
        ket,
        created_at,
        profiles ( *, roles(name) )
      `,
      )
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

// export async function PATCH(req: Request) {
//   try {
//     const supabase = createSupabaseAdmin();
//     const body = await req.json();
//     const { id, status } = body;

//     if (!id || !status) {
//       return NextResponse.json(
//         { error: "id and status are required." },
//         { status: 400 },
//       );
//     }

//     const { data, error } = await supabase
//       .from("adfance")
//       .update({ status })
//       .eq("id", id)
//       .select()
//       .single();

//     if (error) {
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }

//     return NextResponse.json(data);
//   } catch (err: any) {
//     return NextResponse.json(
//       { error: err.message || "Internal server error" },
//       { status: 500 },
//     );
//   }
// }

export async function DELETE(req: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const { error } = await supabase.from("adfance").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

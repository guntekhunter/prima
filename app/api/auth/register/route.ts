import { createSupabaseAdmin } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const body = await req.json();
    const { email, password, fullName, branchId, roleId, roleName } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required." },
        { status: 400 }
      );
    }

    // 1. Create the user in auth.users using the admin client.
    // This prevents logging out the current active admin session!
    const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email so they can log in immediately
      user_metadata: {
        full_name: fullName,
      },
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    const user = userData.user;
    if (!user) {
      return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
    }

    // 2. Insert or upsert the profile in public.profiles.
    // We use upsert because some Supabase setups automatically trigger a profile insertion
    // when a user is created in auth.users. This avoids duplicate key errors.
    const isEnumRole = ["super_admin", "branch_admin"].includes(roleName);
    
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        email: email,
        branch_d: branchId || null,
        role: isEnumRole ? roleName : null, // Set only if it is a valid enum value ('super_admin' or 'branch_admin')
        role_id: roleId || null,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      return NextResponse.json(
        { error: `User created, but profile insertion failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

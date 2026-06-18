"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        async function checkUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            setUser(user);
        }

        checkUser();
    }, []);

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Dashboard</h1>
            <p>{user.email}</p>
        </div>
    );
}
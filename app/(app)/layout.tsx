import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";

async function logout() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Nav logout={logout} />
      <main className="main">{children}</main>
    </div>
  );
}

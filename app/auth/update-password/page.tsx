import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?error=session_expired");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <UpdatePasswordForm />
    </div>
  );
}

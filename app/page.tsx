import HeroGrid from "@/components/hero";
import { getUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <HeroGrid />;
}

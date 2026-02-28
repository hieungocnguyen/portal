import { createClient } from "@/utils/supabase/middleware";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return createClient(request);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

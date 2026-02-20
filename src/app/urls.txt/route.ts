import { redirect } from "next/navigation";

export const dynamic = "force-static";

export function GET() {
  redirect(
    "https://openagentsessions-public.nbg1.your-objectstorage.com/latest/urls.txt",
  );
}

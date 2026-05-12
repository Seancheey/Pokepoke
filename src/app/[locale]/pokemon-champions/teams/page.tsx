import { setRequestLocale } from "next-intl/server";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PlaceholderPage which="teams" />;
}

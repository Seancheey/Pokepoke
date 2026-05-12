import { redirect } from "@/i18n/navigation";

export default async function LocaleRoot({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/pokemon-champions", locale });
}

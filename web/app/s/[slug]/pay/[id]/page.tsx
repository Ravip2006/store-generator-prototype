import PayPageClient from "./pay-page-client";

export default async function PayPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  return <PayPageClient slug={slug} id={id} />;
}

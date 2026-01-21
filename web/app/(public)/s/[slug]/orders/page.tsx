import MyOrdersPageClient from "./orders-page-client";

export default async function MyOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MyOrdersPageClient slug={slug} />;
}

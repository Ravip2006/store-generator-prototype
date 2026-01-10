import CartPageClient from "./cart-page-client";

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CartPageClient slug={slug} />;
}

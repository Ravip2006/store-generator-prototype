import StoreFront from "./StoreFront";

export default async function StoreBySlugPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	return <StoreFront slug={slug} />;
}

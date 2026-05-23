import MarketplaceDetail from "@/components/MarketplaceDetail";

export default async function LawyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MarketplaceDetail kind="lawyer" id={id} />;
}

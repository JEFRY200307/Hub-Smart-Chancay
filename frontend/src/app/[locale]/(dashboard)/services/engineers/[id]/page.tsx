import MarketplaceDetail from "@/components/MarketplaceDetail";

export default async function EngineerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MarketplaceDetail kind="engineer" id={id} />;
}

import MarketplaceDetail from "@/components/MarketplaceDetail";

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ ruc: string }>;
}) {
  const { ruc } = await params;
  return <MarketplaceDetail kind="provider" ruc={ruc} />;
}

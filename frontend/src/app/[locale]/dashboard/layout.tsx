import SharedLayout from "@/components/SharedLayout";

export default function DashboardSubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SharedLayout>{children}</SharedLayout>;
}

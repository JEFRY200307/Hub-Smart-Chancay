import AuthGuard from "@/components/AuthGuard";
import ConciergePanel from "@/components/ConciergePanel";

export default function ConciergePage() {
  return (
    <AuthGuard>
      <ConciergePanel />
    </AuthGuard>
  );
}

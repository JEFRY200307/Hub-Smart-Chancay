import AuthGuard from "@/components/AuthGuard";
import MatchmakingPanel from "@/components/MatchmakingPanel";

export default function MatchmakingPage() {
  return (
    <AuthGuard>
      <MatchmakingPanel />
    </AuthGuard>
  );
}

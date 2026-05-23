import AuthGuard from "@/components/AuthGuard";
import ValidatorPanel from "@/components/ValidatorPanel";

export default function ValidatorPage() {
  return (
    <AuthGuard>
      <ValidatorPanel />
    </AuthGuard>
  );
}

import { withErrorBoundary } from "@/components/common";

function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
    </div>
  );
}

export default withErrorBoundary(SettingsPage, "Settings");

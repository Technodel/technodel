import SettingsTabsClient from "@/components/admin/SettingsTabsClient";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = params?.tab === "general" ? "general" : "api-keys";

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Settings</h1>
        <p style={{ color: "var(--c-muted)", marginTop: 6 }}>
          Manage API providers and fallback keys for admin tools.
        </p>
      </div>

      <SettingsTabsClient initialTab={tab} />
    </div>
  );
}

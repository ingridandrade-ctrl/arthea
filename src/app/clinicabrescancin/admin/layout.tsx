import BrescancinFooter from "../BrescancinFooter";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="brescancin-dark brescancin-admin-shell">
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
      <BrescancinFooter />
    </div>
  );
}

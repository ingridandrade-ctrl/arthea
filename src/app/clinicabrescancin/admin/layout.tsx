import BrescancinFooter from "../BrescancinFooter";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="brescancin-dark">
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
      <BrescancinFooter />
    </div>
  );
}

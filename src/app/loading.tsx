import { CozyLoading } from "@/components/CozyLoading";

export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background:
          "radial-gradient(circle at 85% 8%, rgba(136, 166, 143, 0.24), transparent 34%), radial-gradient(circle at 8% 20%, rgba(245, 139, 111, 0.2), transparent 32%), linear-gradient(135deg, #fff4df 0%, #f4e4ca 100%)",
      }}
    >
      <CozyLoading />
    </main>
  );
}

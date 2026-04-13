import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0b1120] text-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-[68px]">{children}</main>
      <Footer />
    </div>
  );
}

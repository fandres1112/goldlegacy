import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartContext";
import { ToastContainer } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Gold Legacy · Tradición familiar hecha joya",
  description:
    "Gold Legacy: tradición familiar hecha joya. Joyería en oro de lujo accesible con diseño minimalista y elegancia atemporal."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-background text-white">
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <ToastContainer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}


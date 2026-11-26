import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Zomato Reference — Food Delivery",
    template: "%s | Zomato Reference",
  },
  description:
    "A food delivery marketplace reference implementation: discover restaurants, order food, track deliveries and review meals.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7f7f7] text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}

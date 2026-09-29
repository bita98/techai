import "./globals.css";

export const metadata = {
  title: "TechAI",
  description: "دستیار هوشمند تکنولوژی",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
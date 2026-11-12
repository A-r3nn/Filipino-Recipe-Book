import "./globals.css";
import "./extra.css";

export const metadata = {
  title: "Kalderong Pinoy",
  description: "Discover authentic Filipino dishes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

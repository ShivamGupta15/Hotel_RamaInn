export const metadata = {
  title: "Hotel Rama Inn API",
  description: "Next.js Backend API for Hotel Rama Inn",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


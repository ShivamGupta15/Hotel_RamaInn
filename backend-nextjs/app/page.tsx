export default function HomePage() {
  return (
    <main style={{ padding: "40px", fontFamily: "system-ui, sans-serif" }}>
      <h1>Hotel Rama Inn — Backend Service</h1>
      <p>Next.js TypeScript API backend operational.</p>
      <ul>
        <li><a href="/api/health">/api/health</a></li>
        <li><a href="/api/rooms">/api/rooms</a></li>
        <li><a href="/api/admin/metrics">/api/admin/metrics</a></li>
      </ul>
    </main>
  );
}


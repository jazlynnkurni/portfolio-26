import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function ConduitCommercePlaceholder() {
  return (
    <>
      <Nav />
      <main
        className="flex-1 px-6 md:px-16 flex items-center justify-center"
        style={{ backgroundColor: "#FFF5EF", minHeight: "60vh" }}
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-xl">
          <h1
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: 36,
              fontWeight: 400,
              color: "#0D0D0D",
              margin: 0,
            }}
          >
            Conduit Commerce — coming soon
          </h1>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              color: "rgba(13, 13, 13, 0.7)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            this case study is being polished. for now, see the work index.
          </p>
          <Link
            href="/work"
            style={{
              marginTop: 12,
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 14,
              backgroundColor: "#C97836",
              color: "#FFF5EF",
              padding: "10px 16px",
              borderRadius: 10,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            ← back to work
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

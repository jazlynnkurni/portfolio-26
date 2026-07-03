import MahjongTiles from "@/components/MahjongTiles";

export default function MahjongDemoPage() {
  return (
    <main
      className="flex flex-col overflow-x-hidden pb-24"
      style={{ backgroundColor: "#FBEFE4" }}
    >
      {/* Header row echoing the footer mockup */}
      <div className="flex flex-col gap-8 px-6 pt-10 md:flex-row md:justify-between md:px-14">
        <p className="font-serif text-base font-semibold text-black">
          © made in NYC, with love from Indonesia
        </p>
        <div className="flex gap-16 font-mono text-sm uppercase tracking-wide text-black">
          <ul className="flex flex-col gap-5">
            <li>EMAIL</li>
            <li>X</li>
            <li>LINKEDIN</li>
          </ul>
          <ul className="flex flex-col gap-5">
            <li>HOME</li>
            <li>ART GALLERY</li>
            <li>ABOUT ME</li>
            <li>RESUME</li>
          </ul>
        </div>
      </div>

      {/* The interactive physics footer — sits just below the links; the band
          hugs the tiles and the main's bottom padding leaves room under them
          for a shadow. */}
      <MahjongTiles height={300} className="mt-10" />
    </main>
  );
}

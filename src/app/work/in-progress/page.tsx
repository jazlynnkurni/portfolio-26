/**
 * /work/in-progress — placeholder page for case studies that aren't written up
 * yet, dressed as a 404. The numerals bloom into existence as a field of
 * clovers (Bayer-dither order) rather than being drawn; the heading, copy and
 * email underneath are independent DOM, so the page works regardless.
 *
 * (EditableFourOhFour, TearAway and CodeTrail all remain in the repo, unused.)
 */

import Nav from "@/components/Nav";
import MahjongFooter from "@/components/MahjongFooter";
import CloverDither from "@/components/clover404/CloverDither";

export default function InProgressPage() {
  return (
    <>
      <Nav />
      <main className="relative z-10 flex-1">
        <CloverDither />
      </main>
      <div className="relative z-10">
        <MahjongFooter />
      </div>
    </>
  );
}

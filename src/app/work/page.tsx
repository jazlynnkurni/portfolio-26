import { redirect } from "next/navigation";

// The standalone /work index has been retired. The work grid now lives on
// the homepage at /#work. Case-study routes (/work/[slug]) continue to work
// — only this index page redirects.
export default function WorkIndexRedirect() {
  redirect("/#work");
}

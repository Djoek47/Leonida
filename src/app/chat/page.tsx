import { redirect } from "next/navigation";

/** Chat is parked: the full chat lives in ./_chat-page.tsx (not routed) for later.
 *  To bring it back, delete this file and rename _chat-page.tsx to page.tsx. */
export default function Chat() { redirect("/online"); }

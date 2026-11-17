import { redirect } from "next/navigation";

/** Clip Performance was replaced by Mission Briefing. Old links land on the new page. */
export default function Lab() { redirect("/edge/briefing"); }

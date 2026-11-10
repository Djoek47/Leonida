import { redirect } from "next/navigation";
/** The control room moved: it's the Console now. */
export default function Admin() { redirect("/console"); }

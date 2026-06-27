import { redirect } from "next/navigation";

// Account profile + bookings now live together on one page.
export default function AccountHomePage() {
  redirect("/account/bookings");
}

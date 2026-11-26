import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await getSession()) redirect("/browse");
  return <AuthForm mode="register" />;
}

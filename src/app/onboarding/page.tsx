import { redirect } from "next/navigation";
import { getCurrentUser, hasContactInfo } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { ContactForm } from "@/components/contact-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (hasContactInfo(user)) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]">
      <div className="w-full max-w-md px-6">
        <div className="card space-y-5 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl font-extrabold text-white shadow-lg shadow-indigo-500/30">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Bienvenido/a, {user.displayName}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Antes de usar la plataforma tienes que completar tu ficha de
              contacto. El Discord es obligatorio.
            </p>
          </div>

          <ContactForm
            redirectTo="dashboard"
            submitLabel="Activar mi cuenta"
          />

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full justify-center text-sm text-white/40 transition-colors hover:text-white"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
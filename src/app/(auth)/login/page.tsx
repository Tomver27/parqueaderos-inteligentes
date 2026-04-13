import LoginForm from "@/components/auth/LoginForm";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">
        Iniciar sesión
      </h1>
      {error === "link_invalido" && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          El enlace de confirmación es inválido o ya expiró. Intenta registrarte de nuevo.
        </p>
      )}
      <LoginForm />
    </>
  );
}

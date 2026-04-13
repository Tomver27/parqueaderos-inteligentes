import LoginForm from "@/components/auth/LoginForm";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <>
      <h1
        className="mb-6 text-xl text-white"
        style={{ fontWeight: 700 }}
      >
        Iniciar sesión
      </h1>
      {error === "link_invalido" && (
        <p
          className="mb-4 rounded-lg px-4 py-2 text-sm"
          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
        >
          El enlace de confirmación es inválido o ya expiró. Intenta registrarte de nuevo.
        </p>
      )}
      <LoginForm />
    </>
  );
}

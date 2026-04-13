import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <h1
        className="mb-6 text-xl text-white"
        style={{ fontWeight: 700 }}
      >
        Crear cuenta
      </h1>
      <RegisterForm />
    </>
  );
}

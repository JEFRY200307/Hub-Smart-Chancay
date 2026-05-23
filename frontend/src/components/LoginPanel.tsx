"use client";

import LoginForm from "./LoginForm";

export default function LoginPanel() {
  return (
    <LoginForm
      redirectTo="/legal-ai"
      labels={{
        email: "Correo corporativo",
        password: "Contraseña",
        submit: "Acceso seguro",
        register: "Crear cuenta inversor",
        error: "Credenciales inválidas",
      }}
    />
  );
}

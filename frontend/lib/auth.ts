"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL } from "./api";

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email y contraseña requeridos" };
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.detail || "Credenciales inválidas" };
    }

    const data = await response.json();
    
    // Configurar cookie httpOnly
    const cookieStore = await cookies();
    cookieStore.set("token", data.access_token, {
      httpOnly: true,
      secure: false, // allow testing over http (localhost) inside Docker; make conditional in prod
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/",
      sameSite: "lax",
    });
    
  } catch (error) {
    return { error: "Error de conexión con el servidor" };
  }

  redirect("/dashboard");
}

export async function registerAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string || "student";
  const fullName = formData.get("fullName") as string;

  if (!email || !password || !fullName) {
    return { error: "Es necesario llenar todos los campos" };
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role, full_name: fullName }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.detail || "Error al registrar el usuario" };
    }

    // Auto-login después del registro
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (loginResponse.ok) {
      const data = await loginResponse.json();

      // Best-effort profile upsert so full name is persisted on first register.
      await fetch(`${API_URL}/users/profiles/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.access_token}`,
        },
        body: JSON.stringify({
          display_name: fullName,
        }),
      }).catch(() => null);

      const cookieStore = await cookies();
      cookieStore.set("token", data.access_token, {
        httpOnly: true,
        secure: false, // allow testing over http (localhost) inside Docker; make conditional in prod
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
      });
    }

  } catch (error) {
    return { error: "Error de red al intentar registrar" };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/login");
}
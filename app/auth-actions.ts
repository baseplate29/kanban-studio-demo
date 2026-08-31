"use server";

// Stubs — implemented live during the demo (see docs/DEMO.md).
// The auth UI in components/auth-forms.tsx calls these via useActionState
// with (prevState, formData); return an error string, or null on success.

export async function signup(): Promise<string | null> {
  return "Backend not built yet";
}

export async function login(): Promise<string | null> {
  return "Backend not built yet";
}

export async function logout() {}

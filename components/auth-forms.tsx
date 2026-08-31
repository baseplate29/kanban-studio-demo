"use client";

import { SquareKanban } from "lucide-react";
import { useActionState, useState } from "react";
import { login, signup } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, formAction, pending] = useActionState(
    mode === "login" ? login : signup,
    null,
  );

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="flex items-center justify-center gap-2 self-center font-medium">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <SquareKanban className="size-4" />
          </span>
          Kanban Studio
        </h1>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Log in to the shared board"
                : "Pick a username and password to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input id="username" name="username" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input id="password" name="password" type="password" required />
                </Field>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Field>
                  <Button type="submit" disabled={pending}>
                    {mode === "login" ? "Log in" : "Create account"}
                  </Button>
                  <FieldDescription className="text-center">
                    <button
                      type="button"
                      className="underline-offset-4 hover:underline"
                      onClick={() =>
                        setMode(mode === "login" ? "signup" : "login")
                      }
                    >
                      {mode === "login"
                        ? "Need an account? Sign up"
                        : "Have an account? Log in"}
                    </button>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <FieldDescription className="px-6 text-center">
          One shared board for everyone. Edits are live for all users.
        </FieldDescription>
      </div>
    </div>
  );
}

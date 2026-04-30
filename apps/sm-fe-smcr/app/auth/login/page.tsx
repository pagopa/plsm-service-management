// app/auth/login/page.tsx
import { LoginForm } from "@/components/auth/login";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";

const errorMessages: Record<string, string> = {
  callback:
    "Non siamo riusciti a completare il callback di autenticazione. Riprova tra poco.",
  unavailable:
    "Il servizio di autenticazione non e disponibile. Verifica che la function sia raggiungibile.",
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await getServerSession();
  const params = await searchParams;
  const error = params?.error;
  const errorMessage = error ? errorMessages[error] : null;

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Accedi con il tuo account Microsoft</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}

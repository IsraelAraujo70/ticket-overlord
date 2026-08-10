import type { AuthActionState } from "@/server/auth/auth.types";

export function AuthFeedback({ state }: { state: AuthActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={
        state.status === "error"
          ? "text-sm font-medium text-destructive"
          : "text-sm font-medium text-primary"
      }
    >
      {state.message}
    </p>
  );
}

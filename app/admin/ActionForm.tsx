"use client";

import { useFormState } from "react-dom";

export type ActionState = { error?: string };

// Wraps a Server Action bound via useFormState so its errors are actually
// visible to the user. A plain `throw` inside a Server Action gets redacted
// by Next.js in production (replaced with a generic "Application error"
// screen + digest) — the only way to surface a real message is for the
// action to return { error } instead of throwing, which is what this
// component's forms expect their actions to do.
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p className="mt-2 w-full text-xs text-red-500">{state.error}</p>}
    </form>
  );
}

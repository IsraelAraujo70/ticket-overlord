"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { initialEventActionState } from "@/features/events/event.types";
import { publishEventAction } from "@/server/events/event-actions";

export function PublishEventButton({ eventId }: { eventId: string }) {
  const [state, action] = useActionState(
    publishEventAction,
    initialEventActionState,
  );

  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <PublishSubmitButton />
      {state.status === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function PublishSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <SendIcon data-icon="inline-start" />
      )}
      {pending ? "Publicando" : "Publicar evento"}
    </Button>
  );
}

"use client";
import * as A from "@radix-ui/react-alert-dialog";
import { Button } from "./button";
export function ResetDialog({ onConfirm }: { onConfirm: () => void }) {
  return (
    <A.Root>
      <A.Trigger asChild>
        <Button variant="outline">Process another document</Button>
      </A.Trigger>
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm" />
        <A.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-xl">
          <A.Title className="text-xl font-semibold">
            Clear this document?
          </A.Title>
          <A.Description className="mt-3 text-sm leading-6 text-muted-foreground">
            The current document, edits, and results will be cleared from
            memory. Download your results first if you need a copy.
          </A.Description>
          <div className="mt-6 flex justify-end gap-3">
            <A.Cancel asChild>
              <Button variant="outline">Keep working</Button>
            </A.Cancel>
            <A.Action asChild>
              <Button onClick={onConfirm}>Clear and continue</Button>
            </A.Action>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  );
}

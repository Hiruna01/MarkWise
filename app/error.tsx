"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-lg p-8 pt-24">
      <h1 className="text-2xl font-semibold">
        Something interrupted your workspace.
      </h1>
      <p className="my-5 text-muted-foreground">
        Try reopening the workspace. If the problem continues, refresh the page
        and select your PDF again. Your document has not been uploaded.
      </p>
      <Button onClick={reset}>Try again</Button>
      <Button
        className="ml-3"
        variant="outline"
        onClick={() => window.location.reload()}
      >
        Clear and restart
      </Button>
    </main>
  );
}

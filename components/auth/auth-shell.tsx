import Link from "next/link";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="px-6 pt-10 text-center">
        <Link
          href="/login"
          className="font-serif text-2xl tracking-tight text-foreground"
        >
          Bridges
        </Link>
      </header>

      <main
        className={cn(
          "mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10",
          className
        )}
      >
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-3xl tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>
      </main>

      {footer ? (
        <footer className="px-6 pb-10 text-center text-sm text-muted-foreground">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}

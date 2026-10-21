/* Shared chrome for /login and /signup so the two pages cannot drift apart. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="bg-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
        <header className="flex flex-col items-center text-center">
          <div className="bg-accent shadow-accent/30 grid h-16 w-16 place-items-center rounded-2xl shadow-lg">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="4 15 9 10 13 14 20 6" />
            </svg>
          </div>

          <h1 className="text-ink mt-6 text-4xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="text-muted mt-3 text-base leading-relaxed">{subtitle}</p>
        </header>

        <main className="mt-10">{children}</main>

        {footer ? <footer className="mt-8">{footer}</footer> : null}
      </div>
    </div>
  );
}

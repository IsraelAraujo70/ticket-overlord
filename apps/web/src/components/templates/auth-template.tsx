export function AuthTemplate({ children }: { children: React.ReactNode }) {
  return (
    <main className="public-grid grid min-h-screen place-items-center px-5 py-12">
      {children}
    </main>
  );
}

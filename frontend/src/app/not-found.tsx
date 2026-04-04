import Link from 'next/link'

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-barbie-bg-light px-4 text-center">
      <span className="text-6xl" aria-hidden="true">🔍</span>
      <h1 className="text-3xl font-extrabold text-barbie-text">
        Página não encontrada
      </h1>
      <p className="max-w-sm text-sm text-barbie-text/60">
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-barbie-gradient px-8 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90"
      >
        Ir para o início
      </Link>
    </div>
  )
}

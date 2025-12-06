'use client'

/**
 * Global Error Handler for Next.js App Router
 *
 * Note: This is a minimal implementation to avoid Next.js 16 SSG bug
 * with useContext during prerendering. See: https://github.com/vercel/next.js/issues/85668
 *
 * The component uses inline styles to avoid any external dependencies
 * that could trigger the useContext null error during build.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Erro - B3 AI Analysis</title>
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
              Algo deu errado!
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Ocorreu um erro inesperado. Por favor, tente novamente.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

export default function LandingPage() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)' }}>
        ♟ Chessy
      </h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        The elegant chess platform
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <a
          href="/login"
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--color-accent)',
            color: 'var(--color-text-inverse)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--font-semibold)',
          }}
        >
          Sign in
        </a>
        <a
          href="/register"
          style={{
            padding: 'var(--space-3) var(--space-6)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
          }}
        >
          Get started
        </a>
      </div>
    </div>
  );
}
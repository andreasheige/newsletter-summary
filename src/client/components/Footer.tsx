export function Footer() {
  return (
    <footer className="border-t border-border max-w-[1200px] mx-auto p-4 sm:p-8">
      <p className="text-[0.8rem] text-text-secondary">
        Powered by Ollama &middot; Design inspired by{' '}
        <a
          href="https://grebban.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-primary no-underline border-b border-border hover:border-text-primary transition-colors"
        >
          Grebban
        </a>
      </p>
    </footer>
  )
}

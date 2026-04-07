import { PageContainer } from "../../atoms/PageContainer";
import { ExternalLink } from "../../atoms/ExternalLink";
import type { FooterProps } from "./types";

export function Footer({ className }: FooterProps) {
  return (
    <PageContainer
      as="footer"
      className={`border-t border-border p-4 sm:p-8 ${className ?? ""}`}
    >
      <p className="text-[0.8rem] text-text-secondary">
        Powered by Ollama &middot; Created by{" "}
        <ExternalLink href="https://github.com/ai694">
          Andreas Heige
        </ExternalLink>
      </p>
    </PageContainer>
  );
}

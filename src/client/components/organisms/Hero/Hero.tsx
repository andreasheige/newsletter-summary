import { PageContainer } from '../../atoms/PageContainer'
import type { HeroProps } from './types'

export function Hero({ className }: HeroProps) {
  return (
    <PageContainer className={`pt-12 pb-8 sm:pt-20 sm:pb-12 ${className ?? ''}`}>
      <h2 className="text-[clamp(3rem,2rem+3vw,6rem)] font-medium tracking-tighter leading-none text-text-primary">
        Your newsletters,<br />distilled.
      </h2>
    </PageContainer>
  )
}

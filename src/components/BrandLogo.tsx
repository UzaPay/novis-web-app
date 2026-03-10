import novisLogo from '@/assets/novis-logo.svg'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  logoClassName?: string
  textClassName?: string
  showText?: boolean
  text?: string
}

export function BrandLogo({
  className,
  logoClassName,
  textClassName,
  showText = true,
  text = 'Novis Pilot',
}: BrandLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <img
        src={novisLogo}
        alt="Novis Pilot logo"
        className={cn('h-8 w-auto object-contain', logoClassName)}
      />
      {showText ? (
        <span className={cn('text-lg font-semibold tracking-tight', textClassName)}>
          {text}
        </span>
      ) : null}
    </div>
  )
}

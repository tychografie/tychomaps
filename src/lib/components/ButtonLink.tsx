import { memo, ReactNode } from "react"
import { buttonVariants } from "./Button"
import { VariantProps } from "class-variance-authority"
import Link from "next/link"

export interface ButtonLinkProps extends VariantProps<typeof buttonVariants> {
  href: string
  target?: string
  children: ReactNode
}

export const ButtonLink = memo<ButtonLinkProps>((props) => {
  return (
    <Link
      href={props.href}
      className={buttonVariants({ variant: props.variant })}
    >
      {props.children}
    </Link>
  )
})

ButtonLink.displayName = "ButtonLink"

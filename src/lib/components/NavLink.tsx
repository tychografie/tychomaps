import { NavigationMenuLink } from "@radix-ui/react-navigation-menu"
import Link from "next/link"
import { memo, ReactNode } from "react"

interface NavLinkProps {
  children: ReactNode
  href: string
}

export const NavLink = memo<NavLinkProps>((props) => {
  return (
    <NavigationMenuLink asChild>
      <Link href={props.href} className="font-display">
        {props.children}
      </Link>
    </NavigationMenuLink>
  )
})

NavLink.displayName = "NavLink"

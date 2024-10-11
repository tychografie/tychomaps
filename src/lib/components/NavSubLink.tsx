import { NavigationMenuLink } from "@radix-ui/react-navigation-menu"
import Link from "next/link"
import { memo, ReactNode } from "react"

interface NavSubLinkProps {
  children: ReactNode
  href?: string
}

export const NavSubLink = memo<NavSubLinkProps>((props) => {
  return props.href ? (
    <NavigationMenuLink asChild>
      <Link
        className="flex px-4 py-2 whitespace-nowrap hover:bg-gray-100 active:bg-gray-200 rounded-md"
        href={props.href}
      >
        {props.children}
      </Link>
    </NavigationMenuLink>
  ) : (
    <div className="flex px-4 py-2 whitespace-nowrap text-gray-600 rounded-md">
      {props.children}
    </div>
  )
})

NavSubLink.displayName = "NavSubLink"

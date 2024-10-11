/* eslint-disable @next/next/no-img-element */
import { memo } from "react"
import { Button } from "./Button"
import { ButtonLink } from "./ButtonLink"
import Link from "next/link"
import { NavLink, NavLinkVariants } from "./NavLink"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@radix-ui/react-navigation-menu"
import { ChevronDownIcon } from "lucide-react"
import { NavSubLink } from "./NavSubLink"
import { NavSub } from "./NavSub"
import { Nav } from "./Nav"

export const Header = memo(() => {
  return (
    <header className="flex justify-between items-center text-md px-6 py-6">
      <div className="flex items-center gap-2">
        <Link href="/">
          <img
            src="/img/polo-maps.svg"
            alt="Logo"
            className="text-red-500 logo max-h-6 md:max-h-8 mr-4"
          />
        </Link>
        <Nav>
          <NavSub title="City Guides">
            <NavSubLink href="/posts/bologna-local-tips-2024">
              Bologna
            </NavSubLink>
            <NavSubLink href="/posts/groningen-local-tips-2024">
              Groningen
            </NavSubLink>
            <NavSubLink>More soon...</NavSubLink>
          </NavSub>
          <NavLink href="/tips-and-tricks">Tips & Tricks</NavLink>
        </Nav>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <ButtonLink variant="outline" href="/sign-in">
          <span className="font-display hidden md:inline">Login</span>
          <img
            src="/img/icons/account.svg"
            alt="Login"
            className="md:hidden size-5"
          />
        </ButtonLink>
        <Button>
          <span className="font-display hidden md:inline">Get Premium</span>
          <span className="font-display md:hidden">Premium</span>
        </Button>
      </div>
    </header>
  )
})

Header.displayName = "Header"

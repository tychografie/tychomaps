/* eslint-disable @next/next/no-img-element */
import { memo } from "react"
import { Button } from "./Button"
import { ButtonLink } from "./ButtonLink"
import Link from "next/link"
import { Nav } from "./Nav"
import { NavLink } from "./NavLink"
import { NavSub } from "./NavSub"
import { NavSubLink } from "./NavSubLink"
import { PremiumDialog } from "./PremiumDialog"

export const Header = memo(() => {
  return (
    <header className="flex justify-between items-center text-md px-6 py-6 bg-transparent">
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
          <span className="hidden md:inline">Login</span>
          <img
            src="/img/icons/account.svg"
            alt="Login"
            className="md:hidden size-5"
          />
        </ButtonLink>
        <PremiumDialog>
          <Button>
            <span className="hidden md:inline">Get Premium</span>
            <span className="md:hidden">Premium</span>
          </Button>
        </PremiumDialog>
      </div>
    </header>
  )
})

Header.displayName = "Header"

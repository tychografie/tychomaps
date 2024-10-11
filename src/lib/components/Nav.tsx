import {
  NavigationMenu,
  NavigationMenuList,
} from "@radix-ui/react-navigation-menu"
import { memo, ReactNode } from "react"

interface NavProps {
  children: ReactNode
}

export const Nav = memo<NavProps>((props) => {
  return (
    <NavigationMenu className="relative z-10 justify-center hidden md:flex">
      <NavigationMenuList className="flex gap-4">
        {props.children}
      </NavigationMenuList>
    </NavigationMenu>
  )
})

Nav.displayName = "Nav"

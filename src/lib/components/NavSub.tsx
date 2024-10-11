import {
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@radix-ui/react-navigation-menu"
import { ChevronDownIcon } from "lucide-react"
import { memo, ReactNode } from "react"

interface NavSubProps {
  title: string
  children: ReactNode
}

export const NavSub = memo<NavSubProps>((props) => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="group select-none flex items-center gap-1 font-display">
        {props.title}{" "}
        <ChevronDownIcon
          className="relative top-px size-3.5 transition-transform ease-in group-data-[state=open]:-rotate-180"
          aria-hidden
        />
      </NavigationMenuTrigger>
      <NavigationMenuContent className="absolute bg-white left-0 top-10 shadow-md rounded-lg p-1 border">
        {props.children}
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
})

NavSub.displayName = "NavSub"

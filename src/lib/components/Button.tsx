import { memo } from "react"
import { cva, type VariantProps } from "class-variance-authority"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const buttonVariants = cva(
  "rounded-md border px-3 py-2 transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-orange text-black hover:bg-orange-dark border-transparent",
        outline:
          "border border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
)

export const Button = memo<ButtonProps>((props) => {
  return (
    <button className={buttonVariants({ variant: props.variant })}>
      {props.children}
    </button>
  )
})

Button.displayName = "Button"

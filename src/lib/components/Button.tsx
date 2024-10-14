import { memo } from "react"
import { cva, type VariantProps } from "class-variance-authority"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const buttonVariants = cva(
  "rounded-md flex items-center justify-center gap-2 border transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-orange text-black hover:bg-orange-dark border-transparent",
        outline:
          "border border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white",
        clear: "",
      },
      size: {
        md: "px-3 py-2",
        lg: "px-6 py-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
)

export const Button = memo<ButtonProps>(
  ({ variant, size, className, ...props }) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        {...props}
      >
        {props.children}
      </button>
    )
  },
)

Button.displayName = "Button"

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...props}
    />
  )
)
Button.displayName = "Button"

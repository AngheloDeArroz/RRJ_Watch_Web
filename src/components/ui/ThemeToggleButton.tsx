
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useThemeToggle } from "@/components/ThemeProvider";

export function ThemeToggleButton() {
  const { toggleTheme } = useThemeToggle();

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="w-10 h-10"/> // Placeholder
  }

  return (
    <div
      onClick={toggleTheme}
      className="relative flex items-center justify-center h-10 w-10 cursor-pointer rounded-md text-muted-foreground transition-colors hover:text-accent"
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </div>
  )
}

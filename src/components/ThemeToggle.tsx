import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative w-10 h-10 p-0 rounded-full 
                     bg-purple-300/10 text-purple-500 dark:text-purple-300
                     hover:bg-purple-300 hover:text-purple-600 dark:hover:bg-purple-300/20 
                     transition-colors"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-36 bg-purple-50 dark:bg-[#0b0b14] border border-gray-200 dark:border-gray-800 shadow-lg rounded-md"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={
            theme === "light" ? "bg-purple-500/10 text-purple-500" : ""
          }
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={theme === "dark" ? "bg-purple-300/10 text-purple-400" : ""}
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={
            theme === "system" ? "bg-purple-300/10 text-purple-300" : ""
          }
        >
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function SearchBar({ value, onChange, placeholder = "Buscar..." }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 text-sm"
      />
    </div>
  )
}

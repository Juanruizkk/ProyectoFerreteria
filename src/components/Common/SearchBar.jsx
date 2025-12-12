import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

export default function SearchBar({ value, onChange, placeholder = "Buscar..." }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10"
        />
      </div>
      {value && (
        <Button
          variant="outline"
          onClick={() => onChange("")}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Limpiar
        </Button>
      )}
    </div>
  )
}

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Barcode, Plus, Trash2, Save } from "lucide-react"

export default function BarcodeManagerDialog({ producto, open, onClose, onSave }) {
  const [codigos, setCodigos] = useState([])
  const [input, setInput] = useState("")
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (open && producto) {
      const existing = producto.codigoBarras ?? producto.codigosBarras ?? []
      setCodigos(existing.map(cb => ({
        idCodigo: cb.idCodigo ?? cb.IdCodigo ?? 0,
        codigo: cb.codigo ?? cb.Codigo ?? "",
      })))
      setInput("")
      setError("")
    }
  }, [open, producto])

  const agregar = () => {
    const valor = input.trim()
    if (!valor) { setError("El código no puede estar vacío"); return }
    if (codigos.some(cb => cb.codigo === valor)) { setError("Este código ya existe"); return }
    setCodigos(prev => [...prev, { idCodigo: 0, codigo: valor }])
    setInput("")
    setError("")
  }

  const eliminar = (codigo) => setCodigos(prev => prev.filter(cb => cb.codigo !== codigo))

  const handleSave = async () => {
    setGuardando(true)
    try {
      await onSave(producto, codigos)
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            Códigos de barra — {producto?.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Input agregar */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Ingresá un código de barra"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError("") }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregar() } }}
                className={error ? "border-destructive" : ""}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <Button type="button" variant="outline" onClick={agregar} className="gap-1.5">
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>

          {/* Lista de códigos */}
          {codigos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Este producto no tiene códigos de barra
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {codigos.map((cb) => (
                <Badge key={cb.codigo} variant="secondary" className="pl-3 pr-1 py-1 gap-2 text-sm font-mono">
                  {cb.codigo}
                  <button
                    onClick={() => eliminar(cb.codigo)}
                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={guardando}>Cancelar</Button>
          <Button onClick={handleSave} disabled={guardando} className="gap-2">
            <Save className="h-4 w-4" />
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

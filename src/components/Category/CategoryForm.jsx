import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import LoadingButton from "@/components/ui/loading-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, X } from "lucide-react"

export default function CategoryForm({ categoria, onSubmit, onCancel, isSubmitting = false }) {
  const [formData, setFormData] = useState({
    categoria: "",
    descripcion: ""
  })
  const [errores, setErrores] = useState({})

  // Cargar datos cuando se edita una categoría
  useEffect(() => {
    if (categoria) {
      setFormData({
        categoria: categoria.categoria || "",
        descripcion: categoria.descripcion || ""
      })
    } else {
      setFormData({
        categoria: "",
        descripcion: ""
      })
    }
    setErrores({})
  }, [categoria])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Limpiar error del campo al escribir
    if (errores[field]) {
      setErrores(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validarFormulario = () => {
    const e = {}

    // Validar nombre de categoría
    if (!formData.categoria.trim()) {
      e.categoria = "El nombre de la categoría es requerido"
    } else if (formData.categoria.length > 100) {
      e.categoria = "El nombre no puede superar los 100 caracteres"
    }

    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validarFormulario()) return

    const payload = {
      categoria: formData.categoria.trim(),
      descripcion: formData.descripcion?.trim() || ""
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre de la categoría */}
      <div className="space-y-2">
        <Label htmlFor="categoria">Nombre de la categoría *</Label>
        <Input
          id="categoria"
          value={formData.categoria}
          onChange={(e) => handleInputChange("categoria", e.target.value)}
          placeholder="Ej: Herramientas"
          maxLength={100}
          className={errores.categoria ? "border-destructive" : ""}
        />
        {errores.categoria && (
          <p className="text-sm text-destructive">{errores.categoria}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formData.categoria.length}/100 caracteres
        </p>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción (opcional)</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleInputChange("descripcion", e.target.value)}
          placeholder="Descripción de la categoría"
          rows={3}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <LoadingButton
          type="submit"
          loading={isSubmitting}
          loadingText={categoria ? "Actualizando..." : "Guardando..."}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {categoria ? "Actualizar" : "Guardar"} Categoría
        </LoadingButton>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="gap-2 bg-transparent"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </form>
  )
}

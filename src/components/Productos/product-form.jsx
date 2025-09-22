import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, X } from "lucide-react"

export default function ProductForm({ producto, categorias, ubicaciones, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: "",
    marca: "",
    descripcion: "",
    precio: "",
    stock: "",
    stock_minimo: "",
    idubicacion: "",
    idcategoria: "",
  })

  const [errores, setErrores] = useState({})

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || "",
        marca: producto.marca || "",
        descripcion: producto.descripcion || "",
        precio: producto.precio?.toString() || "",
        stock: producto.stock?.toString() || "",
        stock_minimo: producto.stock_minimo?.toString() || "",
        idubicacion: producto.idubicacion?.toString() || "",
        idcategoria: producto.idcategoria?.toString() || "",
      })
    }
  }, [producto])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errores[field]) {
      setErrores((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const validarFormulario = () => {
    const nuevosErrores = {}

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es requerido"
    }

    if (!formData.marca.trim()) {
      nuevosErrores.marca = "La marca es requerida"
    }

    if (!formData.precio || isNaN(Number.parseFloat(formData.precio)) || Number.parseFloat(formData.precio) <= 0) {
      nuevosErrores.precio = "El precio debe ser un número mayor a 0"
    }

    if (!formData.stock || isNaN(Number.parseInt(formData.stock)) || Number.parseInt(formData.stock) < 0) {
      nuevosErrores.stock = "El stock debe ser un número mayor o igual a 0"
    }

    if (
      !formData.stock_minimo ||
      isNaN(Number.parseInt(formData.stock_minimo)) ||
      Number.parseInt(formData.stock_minimo) < 0
    ) {
      nuevosErrores.stock_minimo = "El stock mínimo debe ser un número mayor o igual a 0"
    }

    if (!formData.idcategoria) {
      nuevosErrores.idcategoria = "Debe seleccionar una categoría"
    }

    if (!formData.idubicacion) {
      nuevosErrores.idubicacion = "Debe seleccionar una ubicación"
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0;
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validarFormulario()) {
      return
    }

    const productoData = {
      ...formData,
      precio: Number.parseFloat(formData.precio),
      stock: Number.parseInt(formData.stock),
      stock_minimo: Number.parseInt(formData.stock_minimo),
      idubicacion: Number.parseInt(formData.idubicacion),
      idcategoria: Number.parseInt(formData.idcategoria),
    }

    if (producto) {
      productoData.id = producto.id
    }

    onSubmit(productoData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange("nombre", e.target.value)}
            placeholder="Ingrese el nombre del producto"
            className={errores.nombre ? "border-destructive" : ""} />
          {errores.nombre && <p className="text-sm text-destructive">{errores.nombre}</p>}
        </div>

        {/* Marca */}
        <div className="space-y-2">
          <Label htmlFor="marca">Marca *</Label>
          <Input
            id="marca"
            value={formData.marca}
            onChange={(e) => handleInputChange("marca", e.target.value)}
            placeholder="Ingrese la marca"
            className={errores.marca ? "border-destructive" : ""} />
          {errores.marca && <p className="text-sm text-destructive">{errores.marca}</p>}
        </div>

        {/* Precio */}
        <div className="space-y-2">
          <Label htmlFor="precio">Precio *</Label>
          <Input
            id="precio"
            type="number"
            step="0.01"
            min="0"
            value={formData.precio}
            onChange={(e) => handleInputChange("precio", e.target.value)}
            placeholder="0.00"
            className={errores.precio ? "border-destructive" : ""} />
          {errores.precio && <p className="text-sm text-destructive">{errores.precio}</p>}
        </div>

        {/* Stock */}
        <div className="space-y-2">
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => handleInputChange("stock", e.target.value)}
            placeholder="0"
            className={errores.stock ? "border-destructive" : ""} />
          {errores.stock && <p className="text-sm text-destructive">{errores.stock}</p>}
        </div>

        {/* Stock Mínimo */}
        <div className="space-y-2">
          <Label htmlFor="stock_minimo">Stock Mínimo *</Label>
          <Input
            id="stock_minimo"
            type="number"
            min="0"
            value={formData.stock_minimo}
            onChange={(e) => handleInputChange("stock_minimo", e.target.value)}
            placeholder="0"
            className={errores.stock_minimo ? "border-destructive" : ""} />
          {errores.stock_minimo && <p className="text-sm text-destructive">{errores.stock_minimo}</p>}
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría *</Label>
          <Select
            value={formData.idcategoria}
            onValueChange={(value) => handleInputChange("idcategoria", value)}>
            <SelectTrigger className={errores.idcategoria ? "border-destructive" : ""}>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id.toString()}>
                  {categoria.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errores.idcategoria && <p className="text-sm text-destructive">{errores.idcategoria}</p>}
        </div>

        {/* Ubicación */}
        <div className="space-y-2">
          <Label htmlFor="ubicacion">Ubicación *</Label>
          <Select
            value={formData.idubicacion}
            onValueChange={(value) => handleInputChange("idubicacion", value)}>
            <SelectTrigger className={errores.idubicacion ? "border-destructive" : ""}>
              <SelectValue placeholder="Seleccionar ubicación" />
            </SelectTrigger>
            <SelectContent>
              {ubicaciones.map((ubicacion) => (
                <SelectItem key={ubicacion.id} value={ubicacion.id.toString()}>
                  {ubicacion.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errores.idubicacion && <p className="text-sm text-destructive">{errores.idubicacion}</p>}
        </div>
      </div>
      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleInputChange("descripcion", e.target.value)}
          placeholder="Descripción del producto (opcional)"
          rows={3} />
      </div>
      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" className="gap-2">
          <Save className="h-4 w-4" />
          {producto ? "Actualizar" : "Crear"} Producto
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="gap-2 bg-transparent">
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </form>
  );
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"

export default function ClientForm({ clientId = null, idUsuarioRegistra = 0 }) {
  const router = useRouter()
  const { toast } = useToast()
  const isEditMode = !!clientId

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    razonSocial: "",
    dni: "",
    cuit: "",
    telefono: "",
    mail: "",
    tieneCuentaCorriente: false,
    limiteCuenta: 0,
    saldoInicial: 0,
    idUsuarioRegistra: idUsuarioRegistra,
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) {
      fetchClienteData()
    }
  }, [clientId])

  const fetchClienteData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/clientes/${clientId}`)

      if (!response.ok) {
        throw new Error("Error al cargar los datos del cliente")
      }

      const data = await response.json()
      setFormData({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        razonSocial: data.razonSocial || "",
        dni: data.dni || "",
        cuit: data.cuit || "",
        telefono: data.telefono || "",
        mail: data.mail || "",
        tieneCuentaCorriente: data.tieneCuentaCorriente || false,
        limiteCuenta: data.limiteCuenta || 0,
        saldoInicial: data.saldoInicial || 0,
        idUsuarioRegistra: data.idUsuarioRegistra || idUsuarioRegistra,
      })
    } catch (error) {
      console.error("[v0] Error fetching cliente data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del cliente.",
        variant: "destructive",
      })
      router.push("/clientes")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Validar que tenga al menos DNI o CUIT
    if (!formData.dni.trim() && !formData.cuit.trim()) {
      newErrors.dni = "Debe ingresar DNI o CUIT"
      newErrors.cuit = "Debe ingresar DNI o CUIT"
    }

    // Validar que para persona física tenga nombre y apellido
    if (!formData.razonSocial.trim() && (!formData.nombre.trim() || !formData.apellido.trim())) {
      if (!formData.nombre.trim()) {
        newErrors.nombre = "El nombre es requerido para persona física"
      }
      if (!formData.apellido.trim()) {
        newErrors.apellido = "El apellido es requerido para persona física"
      }
    }

    // Validar que para empresa tenga razón social
    if (!formData.nombre.trim() && !formData.apellido.trim() && !formData.razonSocial.trim()) {
      newErrors.razonSocial = "La razón social es requerida para empresa"
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.mail.trim() && !emailRegex.test(formData.mail)) {
      newErrors.mail = "Ingrese un email válido"
    }

    // Validar números
    if (isNaN(formData.limiteCuenta) || formData.limiteCuenta < 0) {
      newErrors.limiteCuenta = "Ingrese un valor numérico válido"
    }

    if (isNaN(formData.saldoInicial)) {
      newErrors.saldoInicial = "Ingrese un valor numérico válido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const url = isEditMode ? `/api/clientes/${clientId}` : "/api/clientes"
      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(isEditMode ? "Error al actualizar el cliente" : "Error al crear el cliente")
      }

      toast({
        title: "Éxito",
        description: isEditMode ? "Cliente actualizado correctamente" : "Cliente creado correctamente",
      })

      router.push("/clientes")
    } catch (error) {
      console.error("[v0] Error submitting form:", error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar el cliente.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/clientes")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
        <span className="ml-2 text-muted-foreground">Cargando datos...</span>
      </div>
    )
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditMode ? "Editar Cliente" : "Nuevo Cliente"}</CardTitle>
        <CardDescription>
          {isEditMode ? "Actualiza la información del cliente" : "Completa los datos para registrar un nuevo cliente"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos personales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datos Personales / Empresa</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  placeholder="Nombre de la persona"
                />
                {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => handleChange("apellido", e.target.value)}
                  placeholder="Apellido de la persona"
                />
                {errors.apellido && <p className="text-sm text-destructive">{errors.apellido}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón Social</Label>
              <Input
                id="razonSocial"
                value={formData.razonSocial}
                onChange={(e) => handleChange("razonSocial", e.target.value)}
                placeholder="Razón social de la empresa"
              />
              {errors.razonSocial && <p className="text-sm text-destructive">{errors.razonSocial}</p>}
              <p className="text-sm text-muted-foreground">
                Completar solo si es empresa. De lo contrario, usar nombre y apellido.
              </p>
            </div>
          </div>

          {/* Identificación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Identificación</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  value={formData.dni}
                  onChange={(e) => handleChange("dni", e.target.value)}
                  placeholder="12345678"
                />
                {errors.dni && <p className="text-sm text-destructive">{errors.dni}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuit">CUIT</Label>
                <Input
                  id="cuit"
                  value={formData.cuit}
                  onChange={(e) => handleChange("cuit", e.target.value)}
                  placeholder="20-12345678-9"
                />
                {errors.cuit && <p className="text-sm text-destructive">{errors.cuit}</p>}
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datos de Contacto</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  placeholder="3815551234"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mail">Email</Label>
                <Input
                  id="mail"
                  type="email"
                  value={formData.mail}
                  onChange={(e) => handleChange("mail", e.target.value)}
                  placeholder="cliente@ejemplo.com"
                />
                {errors.mail && <p className="text-sm text-destructive">{errors.mail}</p>}
              </div>
            </div>
          </div>

          {/* Cuenta Corriente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cuenta Corriente</h3>

            <div className="flex items-center space-x-2">
              <Switch
                id="tieneCuentaCorriente"
                checked={formData.tieneCuentaCorriente}
                onCheckedChange={(checked) => handleChange("tieneCuentaCorriente", checked)}
              />
              <Label htmlFor="tieneCuentaCorriente" className="cursor-pointer">
                Habilitar cuenta corriente
              </Label>
            </div>

            {formData.tieneCuentaCorriente && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="limiteCuenta">Límite de Cuenta</Label>
                  <Input
                    id="limiteCuenta"
                    type="number"
                    step="0.01"
                    value={formData.limiteCuenta}
                    onChange={(e) => handleChange("limiteCuenta", Number.parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  {errors.limiteCuenta && <p className="text-sm text-destructive">{errors.limiteCuenta}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saldoInicial">Saldo Inicial</Label>
                  <Input
                    id="saldoInicial"
                    type="number"
                    step="0.01"
                    value={formData.saldoInicial}
                    onChange={(e) => handleChange("saldoInicial", Number.parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  {errors.saldoInicial && <p className="text-sm text-destructive">{errors.saldoInicial}</p>}
                  <p className="text-sm text-muted-foreground">Puede ser positivo (a favor) o negativo (deuda)</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {isEditMode ? "Actualizando..." : "Guardando..."}
                </>
              ) : isEditMode ? (
                "Actualizar Cliente"
              ) : (
                "Crear Cliente"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

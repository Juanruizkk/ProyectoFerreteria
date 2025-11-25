"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"

export default function ClientDetailsModal({ clientId, onClose }) {
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (clientId) {
      fetchClienteDetails()
    }
  }, [clientId])

  const fetchClienteDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/clientes/${clientId}`)

      if (!response.ok) {
        throw new Error("Error al cargar los detalles del cliente")
      }

      const data = await response.json()
      setCliente(data)
    } catch (error) {
      console.error("[v0] Error fetching cliente details:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del cliente.",
        variant: "destructive",
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const getNombreCompleto = () => {
    if (cliente.razonSocial && cliente.razonSocial.trim() !== "") {
      return cliente.razonSocial
    }
    return `${cliente.nombre} ${cliente.apellido}`.trim()
  }

  return (
    <Dialog open={!!clientId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalles del Cliente</DialogTitle>
          <DialogDescription>Información completa del cliente</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
            <span className="ml-2 text-muted-foreground">Cargando...</span>
          </div>
        ) : cliente ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre Completo / Empresa</p>
                <p className="text-base font-semibold">{getNombreCompleto()}</p>
              </div>

              {cliente.nombre && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-base">{cliente.nombre}</p>
                </div>
              )}

              {cliente.apellido && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Apellido</p>
                  <p className="text-base">{cliente.apellido}</p>
                </div>
              )}

              {cliente.razonSocial && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Razón Social</p>
                  <p className="text-base">{cliente.razonSocial}</p>
                </div>
              )}

              {cliente.dni && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">DNI</p>
                  <p className="text-base">{cliente.dni}</p>
                </div>
              )}

              {cliente.cuit && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CUIT</p>
                  <p className="text-base">{cliente.cuit}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                <p className="text-base">{cliente.telefono || "-"}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base break-all">{cliente.mail || "-"}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Cuenta Corriente</p>
                <Badge variant={cliente.tieneCuentaCorriente ? "default" : "secondary"}>
                  {cliente.tieneCuentaCorriente ? "Activa" : "No tiene"}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No se encontró información del cliente</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

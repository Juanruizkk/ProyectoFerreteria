"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import ClientTable from "@/components/clientes/ClientTable"
import ClientDetailsModal from "@/components/clientes/ClientDetailsModal"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"

export default function ClientesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasPrevioPage, setHasPrevioPage] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    fetchClientes()
  }, [currentPage, searchTerm])

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        pagedIndex: currentPage,
        pageSize: pageSize,
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/clientes?${params}`)

      if (!response.ok) {
        throw new Error("Error al cargar los clientes")
      }

      const data = await response.json()

      setClientes(data.items || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.totalCount || 0)
      setHasPrevioPage(data.hasPrevioPage || false)
      setHasNextPage(data.hasNextPage || false)
    } catch (error) {
      console.error("[v0] Error fetching clientes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page on new search
  }

  const handleViewDetails = (clientId) => {
    setSelectedClientId(clientId)
    setShowDetailsModal(true)
  }

  const handleEdit = (clientId) => {
    router.push(`/clientes/${clientId}/editar`)
  }

  const handleDelete = async (clientId) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
      return
    }

    try {
      const response = await fetch(`/api/clientes/${clientId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el cliente")
      }

      toast({
        title: "Éxito",
        description: "Cliente eliminado correctamente",
      })

      // Refresh the list
      fetchClientes()
    } catch (error) {
      console.error("[v0] Error deleting cliente:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handlePreviousPage = () => {
    if (hasPrevioPage) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <Button onClick={() => router.push("/clientes/nuevo")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo cliente
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre, apellido, DNI, CUIT, correo o teléfono..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
            <span className="ml-2 text-muted-foreground">Cargando clientes...</span>
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No se encontraron clientes</p>
            {searchTerm && <p className="text-sm mt-2">Intenta con otro término de búsqueda</p>}
          </div>
        ) : (
          <>
            <ClientTable
              clientes={clientes}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} • Total: {totalCount} clientes
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePreviousPage} disabled={!hasPrevioPage}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={handleNextPage} disabled={!hasNextPage}>
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <ClientDetailsModal clientId={selectedClientId} onClose={() => setShowDetailsModal(false)} />
      )}
    </div>
  )
}

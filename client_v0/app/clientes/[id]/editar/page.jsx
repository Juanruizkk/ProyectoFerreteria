"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import ClientForm from "@/components/clientes/ClientForm"

export default function EditarClientePage({ params }) {
  const router = useRouter()
  const { id } = use(params)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/clientes")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a clientes
        </Button>
      </div>

      <ClientForm clientId={id} idUsuarioRegistra={0} />
    </div>
  )
}

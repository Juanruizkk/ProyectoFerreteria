import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Botón reutilizable con estado de carga.
 * Muestra un spinner y texto alternativo mientras `loading` es true.
 *
 * Props:
 *  - loading: bool
 *  - loadingText: string (opcional, default "Cargando...")
 *  - children: contenido del botón en estado normal
 *  - ...props: todos los props de Button (variant, size, disabled, etc.)
 */
export default function LoadingButton({ loading = false, loadingText = "Cargando...", children, disabled, ...props }) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
/* import { AppSidebar } from "@/components/Common/AppSidebar" */
import { AppSidebar } from "./app-sidebar"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout, getCurrentUser } from "@/services/AuthService"
import { toast } from "sonner"

export default function Layout({ children }) {
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada exitosamente");
    // Forzar recarga completa para asegurar que se muestre el login
    window.location.href = "/login";
  };

  return (
     <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-col flex-1 min-h-screen">
        {/* Header */}
        <header className="flex h-14 items-center gap-2 border-b px-4 bg-background shadow-sm justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <span className="text-sm font-semibold tracking-tight text-foreground">Sistema Ferretería</span>
          </div>

          {/* Usuario logueado y botón de cerrar sesión */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{currentUser?.username || "Usuario"}</span>
              <span className="text-xs text-muted-foreground capitalize">{currentUser?.role || "Sin rol"}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </header>

        {/* Aca van las paginas */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
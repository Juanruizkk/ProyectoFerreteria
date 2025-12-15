import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
/* import { AppSidebar } from "@/components/Common/AppSidebar" */
import { AppSidebar } from "./app-sidebar"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { logout, getCurrentUser } from "@/services/AuthService"
import { toast } from "sonner"

export default function Layout({ children }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada exitosamente");
    navigate("/login");
  };

  return (
     <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-col flex-1 min-h-screen">
        {/* Header */}
        <header className="flex h-16 items-center gap-2 border-b px-4 bg-background justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="text-lg font-semibold">Sistema Ferretería</div>
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
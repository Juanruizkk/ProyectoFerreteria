import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
/* import { AppSidebar } from "@/components/Common/AppSidebar" */
import { AppSidebar } from "./app-sidebar"
import { Toaster } from "sonner"

export default function Layout({ children }) {
  return (
     <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-col flex-1 min-h-screen">
        {/* Header */}
        <header className="flex h-16 items-center gap-2 border-b px-4 bg-background">
          <SidebarTrigger className="-ml-1" />
          <div className="text-lg font-semibold">Sistema Ferretería</div>
        </header>

        {/* Aca van las paginas */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
      <Toaster position="top-right" richColors expand theme="system" />
    </SidebarProvider>
  )
}
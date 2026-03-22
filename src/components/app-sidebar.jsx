import { useState } from "react"
import { Users, UserCircle, Package, Home, Settings, History, ShoppingCart, ChevronDown, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import PermissionGuard from "@/components/PermissionGuard"
import { PermissionGroups } from "@/config/permissions"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <Sidebar variant="inset">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Sistema Ferretería</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Home */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/">
                    <Home />
                    <span>Inicio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Usuarios */}
              <PermissionGuard anyOf={Object.values(PermissionGroups.USERS.permissions)}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/usuarios">
                      <Users />
                      <span>Usuarios</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Clientes */}
              <PermissionGuard anyOf={Object.values(PermissionGroups.CLIENTS.permissions)}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/clientes">
                      <UserCircle />
                      <span>Clientes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Ventas */}
              <PermissionGuard anyOf={Object.values(PermissionGroups.SALES.permissions)}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/ventas">
                      <ShoppingCart />
                      <span>Ventas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Productos */}
              <PermissionGuard anyOf={Object.values(PermissionGroups.PRODUCTS.permissions)}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/productos">
                      <Package />
                      <span>Productos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Configuración (colapsable) */}
              <PermissionGuard
                anyOf={[
                  ...Object.values(PermissionGroups.PRODUCTS.permissions),
                  ...Object.values(PermissionGroups.CURRENT_ACCOUNT.permissions),
                ]}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setConfigOpen((prev) => !prev)}
                    className="w-full"
                  >
                    <Settings className="w-5 h-5 shrink-0" />
                    <span>Configuración</span>
                    {configOpen
                      ? <ChevronDown className="ml-auto h-4 w-4 transition-transform" />
                      : <ChevronRight className="ml-auto h-4 w-4 transition-transform" />
                    }
                  </SidebarMenuButton>

                  {configOpen && (
                    <SidebarMenuSub>
                      <PermissionGuard anyOf={Object.values(PermissionGroups.PRODUCTS.permissions)}>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link to="/categorias">
                              <span>Productos</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </PermissionGuard>

                      <PermissionGuard anyOf={Object.values(PermissionGroups.CURRENT_ACCOUNT.permissions)}>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link to="/configuracion-cc">
                              <span>Cta. Corriente</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </PermissionGuard>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Auditoría */}
              <PermissionGuard anyOf={Object.values(PermissionGroups.HISTORY.permissions)}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/auditoria">
                      <History />
                      <span>Auditoría</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

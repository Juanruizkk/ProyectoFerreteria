import { useState, useEffect } from "react"
import { Users, UserCircle, Package, Home, Settings, History, ShoppingCart, ChevronDown, ChevronRight, Truck, ClipboardList, BarChart2 } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
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
  const { pathname } = useLocation();

  const configRoutes = ["/categorias", "/configuracion-cc", "/configuracion-ferreteria"];
  const isConfigActive = configRoutes.some((r) => pathname.startsWith(r));

  const [configOpen, setConfigOpen] = useState(isConfigActive);

  // Si se navega a una sub-ruta de Configuración, abrir el colapsable
  useEffect(() => {
    if (isConfigActive) setConfigOpen(true);
  }, [isConfigActive]);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Sistema Ferretería</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Home */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"}>
                  <Link to="/">
                    <Home />
                    <span>Inicio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Usuarios */}
              <PermissionGuard anyOf={Object.values(PermissionGroups.USERS.permissions)}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/usuarios")}>
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
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/clientes")}>
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
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/ventas")}>
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
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/productos")}>
                    <Link to="/productos">
                      <Package />
                      <span>Productos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Compras */}
              <PermissionGuard anyOf={Object.values(PermissionGroups.PURCHASES.permissions)}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/compras")}>
                    <Link to="/compras">
                      <ClipboardList />
                      <span>Compras</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Proveedores */}
              <PermissionGuard anyOf={Object.values(PermissionGroups.SUPPLIERS.permissions)}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/proveedores")}>
                    <Link to="/proveedores">
                      <Truck />
                      <span>Proveedores</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Reportes */}
              <PermissionGuard anyOf={Object.values(PermissionGroups.REPORTS.permissions)}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/reportes")}>
                    <Link to="/reportes">
                      <BarChart2 />
                      <span>Reportes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Configuración (colapsable) */}
              <PermissionGuard
                anyOf={[
                  "PROD_CREATE", "PROD_UPDATE",
                  ...Object.values(PermissionGroups.USERS.permissions),
                  "CC_MANAGE",
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
                      <PermissionGuard anyOf={["PROD_CREATE", "PROD_UPDATE"]}>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname.startsWith("/categorias")}>
                            <Link to="/categorias">
                              <span>Categorías productos</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </PermissionGuard>

                      <PermissionGuard anyOf={Object.values(PermissionGroups.USERS.permissions)}>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname.startsWith("/configuracion-ferreteria")}>
                            <Link to="/configuracion-ferreteria">
                              <span>Datos de Empresa</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </PermissionGuard>

                      <PermissionGuard permission="CC_MANAGE">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname.startsWith("/configuracion-cc")}>
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
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/auditoria")}>
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

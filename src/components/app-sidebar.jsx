import { Users, UserCircle, Package, Home, Settings, Layers, History, ShoppingCart, Truck, ClipboardList, BarChart2 } from "lucide-react"
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
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Sistema Ferretería</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Home - siempre visible */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/">
                    <Home />
                    <span>Inicio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Usuarios - solo si tiene algún permiso USR_* */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.USERS.permissions)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/usuarios">
                      <Users />
                      <span>Usuarios</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Clientes - solo si tiene algún permiso CLI_* */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.CLIENTS.permissions)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/clientes">
                      <UserCircle />
                      <span>Clientes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Ventas - solo si tiene algún permiso VEN_* */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.SALES.permissions)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/ventas">
                      <ShoppingCart />
                      <span>Ventas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Productos - solo si tiene algún permiso PROD_* */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.PRODUCTS.permissions)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/productos">
                      <Package />
                      <span>Productos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Compras - solo si tiene algún permiso COMP_* */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.PURCHASES.permissions)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/compras">
                      <ClipboardList />
                      <span>Compras</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Proveedores - solo si tiene algún permiso PROV_* */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.SUPPLIERS.permissions)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/proveedores">
                      <Truck />
                      <span>Proveedores</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Categorías - solo si tiene algún permiso PROD_* */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.PRODUCTS.permissions)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/categorias">
                      <Layers />
                      <span>Categorías</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Configuración CC - solo si tiene algún permiso CC_* */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.CURRENT_ACCOUNT.permissions)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/configuracion-cc">
                      <Settings />
                      <span>Configuración CC</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Reportes - solo si tiene permiso REP_* */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.REPORTS.permissions)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/reportes">
                      <BarChart2 />
                      <span>Reportes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Auditoría - solo si tiene permiso HIS_VIEW */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.HISTORY.permissions)}
              >
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

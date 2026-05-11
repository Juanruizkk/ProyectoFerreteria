import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Filter } from "lucide-react";
import { searchUsers } from "@/services/UsersQueries";
import { toast } from "sonner";

const ENTIDADES = [
  { value: "todas",                 label: "Todas las entidades"         },
  { value: "CLIENTE",               label: "Cliente"                     },
  { value: "PRODUCTO",              label: "Producto"                    },
  { value: "VENTA",                 label: "Venta"                       },
  { value: "USUARIO",               label: "Usuario"                     },
  { value: "PROVEEDOR",             label: "Proveedor"                   },
  { value: "COMPRA",                label: "Compra a proveedor"          },
  // Datos maestros — productos
  { value: "CATEGORIA",             label: "Categoría"                   },
  { value: "UBICACION",             label: "Ubicación"                   },
  { value: "TIPO_MOVIMIENTO_STOCK", label: "Tipo de movimiento de stock" },
  { value: "UNIDAD_MEDIDA",         label: "Unidad de medida"            },
  // Configuración del sistema
  { value: "CONFIGURACION_CC",      label: "Config. cuenta corriente"    },
  { value: "MOTIVO_NOTA_CREDITO",   label: "Motivo nota de crédito"      },
  { value: "MOTIVO_NOTA_DEBITO",    label: "Motivo nota de débito"       },
  { value: "CONFIGURACION_INTERES", label: "Config. intereses"           },
  { value: "EMPRESA",               label: "Datos de la empresa"         },
];

// Acciones disponibles por entidad
const ACCIONES_POR_ENTIDAD = {
  todas: [
    { value: "todas",               label: "Todas las acciones"          },
    { value: "CREACION",            label: "Creación"                    },
    { value: "ACTUALIZACION",       label: "Actualización"               },
    { value: "BAJA",                label: "Baja"                        },
    { value: "REACTIVACION",        label: "Reactivación"                },
    { value: "PRECIO_ACTUALIZADO",  label: "Precio actualizado"          },
    { value: "NOMBRE_ACTUALIZADO",  label: "Nombre actualizado"          },
    { value: "STOCK_INGRESO",       label: "Ingreso de stock"            },
    { value: "STOCK_EGRESO",        label: "Egreso de stock"             },
    { value: "AJUSTE_STOCK",        label: "Ajuste de stock"             },
    { value: "IMPORTACION_PRECIOS",          label: "Importación de precios"           },
    { value: "ACTUALIZACION_PRECIOS_MANUAL", label: "Actualización masiva de precios"  },
    { value: "ACTUALIZACION_PRECIOS_EXCEL",  label: "Actualización de precios por Excel"},
    { value: "CC_CREADA",                    label: "Cuenta corriente creada"          },
    { value: "VENTA_REGISTRADA",    label: "Venta registrada"            },
    { value: "VENTA_PENDIENTE",     label: "Venta pendiente"             },
    { value: "VENTA_ANULADA",        label: "Venta anulada"               },
    { value: "COMPRA_REGISTRADA",   label: "Compra registrada"           },
    { value: "COMPRA_ANULADA",      label: "Compra anulada"              },
    { value: "CAMBIO_CONTRASEÑA",   label: "Cambio de contraseña"        },
    { value: "CONSULTA_REPORTE",    label: "Consulta de reporte"         },
    { value: "INSERT",              label: "Inserción (sistema)"         },
    { value: "UPDATE",              label: "Actualización (sistema)"     },
    { value: "DELETE",              label: "Eliminación (sistema)"       },
  ],
  PRODUCTO: [
    { value: "todas",               label: "Todas las acciones"          },
    { value: "CREACION",            label: "Creación"                    },
    { value: "ACTUALIZACION",       label: "Actualización"               },
    { value: "BAJA",                label: "Baja"                        },
    { value: "REACTIVACION",        label: "Reactivación"                },
    { value: "PRECIO_ACTUALIZADO",  label: "Precio actualizado"          },
    { value: "NOMBRE_ACTUALIZADO",  label: "Nombre actualizado"          },
    { value: "STOCK_INGRESO",       label: "Ingreso de stock"            },
    { value: "STOCK_EGRESO",        label: "Egreso de stock"             },
    { value: "AJUSTE_STOCK",        label: "Ajuste de stock"             },
    { value: "IMPORTACION_PRECIOS",           label: "Importación de precios"           },
    { value: "ACTUALIZACION_PRECIOS_MANUAL",  label: "Actualización masiva de precios"  },
    { value: "ACTUALIZACION_PRECIOS_EXCEL",   label: "Actualización de precios por Excel"},
  ],
  CLIENTE: [
    { value: "todas",               label: "Todas las acciones"          },
    { value: "CREACION",            label: "Creación"                    },
    { value: "ACTUALIZACION",       label: "Actualización"               },
    { value: "BAJA",                label: "Baja"                        },
    { value: "REACTIVACION",        label: "Reactivación"                },
    { value: "CC_CREADA",           label: "Cuenta corriente creada"     },
  ],
  VENTA: [
    { value: "todas",               label: "Todas las acciones"          },
    { value: "VENTA_REGISTRADA",    label: "Venta registrada"            },
    { value: "VENTA_PENDIENTE",     label: "Venta pendiente"             },
    { value: "VENTA_ANULADA",       label: "Venta anulada"               },
  ],
  USUARIO: [
    { value: "todas",               label: "Todas las acciones"          },
    { value: "CREACION",            label: "Creación"                    },
    { value: "ACTUALIZACION",       label: "Actualización"               },
    { value: "BAJA",                label: "Baja"                        },
    { value: "REACTIVACION",        label: "Reactivación"                },
    { value: "CAMBIO_CONTRASEÑA",   label: "Cambio de contraseña"        },
  ],
  PROVEEDOR: [
    { value: "todas",         label: "Todas las acciones"    },
    { value: "INSERT",        label: "Alta (sistema)"         },
    { value: "UPDATE",        label: "Modificación (sistema)" },
    { value: "ACTUALIZACION", label: "Modificación"           },
    { value: "BAJA",          label: "Baja"                   },
    { value: "REACTIVACION",  label: "Reactivación"           },
  ],
  COMPRA: [
    { value: "todas",             label: "Todas las acciones" },
    { value: "COMPRA_REGISTRADA", label: "Compra registrada"  },
    { value: "COMPRA_ANULADA",    label: "Compra anulada"     },
  ],
};

// Acciones genéricas para entidades de datos maestros (solo triggers: INSERT/UPDATE/DELETE)
const ACCIONES_DATOS_MAESTROS = [
  { value: "todas",  label: "Todas las acciones" },
  { value: "INSERT", label: "Creación"           },
  { value: "UPDATE", label: "Modificación"       },
  { value: "DELETE", label: "Eliminación"        },
];

const ENTIDADES_DATOS_MAESTROS = new Set([
  "CATEGORIA", "UBICACION", "TIPO_MOVIMIENTO_STOCK", "UNIDAD_MEDIDA",
  "CONFIGURACION_CC", "MOTIVO_NOTA_CREDITO", "MOTIVO_NOTA_DEBITO",
  "CONFIGURACION_INTERES", "EMPRESA",
]);

export function AuditFilters({ onSearch, onClear, isLoading }) {
  const [filters, setFilters] = useState({
    entidadTipo: "todas",
    accion: "todas",
    searchTerm: "",
    idUsuario: "todos",
    from: "",
    to: "",
  });

  const [dateError, setDateError] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Cargar usuarios activos al montar el componente
  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const response = await searchUsers({
          pageIndex: 1,
          searchTerm: "",
          estado: "activos",
        });
        setUsuarios(response.items || []);
      } catch (err) {
        toast.error("Error al cargar usuarios: " + err.message);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  useEffect(() => {
    // Validar rango de fechas
    if (filters.from && filters.to) {
      const fromDate = new Date(filters.from);
      const toDate = new Date(filters.to);

      if (fromDate > toDate) {
        setDateError("La fecha inicial no puede ser mayor a la fecha final");
      } else {
        setDateError("");
      }
    } else {
      setDateError("");
    }
  }, [filters.from, filters.to]);

  const getAcciones = (entidad) =>
    ENTIDADES_DATOS_MAESTROS.has(entidad)
      ? ACCIONES_DATOS_MAESTROS
      : (ACCIONES_POR_ENTIDAD[entidad] ?? ACCIONES_POR_ENTIDAD.todas);

  const accionesDisponibles = getAcciones(filters.entidadTipo);

  const handleChange = (field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "entidadTipo") {
        const acciones = getAcciones(value);
        const accionValida = acciones.some((a) => a.value === prev.accion);
        if (!accionValida) next.accion = "todas";
      }
      return next;
    });
  };

  const handleSearch = () => {
    if (dateError) return;

    const searchParams = {
      ...(filters.entidadTipo !== "todas" && {
        entidadTipo: filters.entidadTipo,
      }),
      ...(filters.accion !== "todas" && { accion: filters.accion }),
      ...(filters.searchTerm && { searchTerm: filters.searchTerm }),
      ...(filters.idUsuario !== "todos" && { idUsuario: filters.idUsuario }),
      ...(filters.from && { from: new Date(filters.from).toISOString() }),
      ...(filters.to && { to: new Date(filters.to).toISOString() }),
    };

    onSearch(searchParams);
  };

  const handleClear = () => {
    setFilters({
      entidadTipo: "todas",
      accion: "todas",
      searchTerm: "",
      idUsuario: "todos",
      from: "",
      to: "",
    });
    setDateError("");
    onClear();
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Filtros de búsqueda</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Entidad */}
          <div className="space-y-2">
            <Label htmlFor="entidad">Entidad</Label>
            <Select
              value={filters.entidadTipo}
              onValueChange={(value) => handleChange("entidadTipo", value)}
            >
              <SelectTrigger id="entidad">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTIDADES.map((entidad) => (
                  <SelectItem key={entidad.value} value={entidad.value}>
                    {entidad.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Acción */}
          <div className="space-y-2">
            <Label htmlFor="accion">Acción</Label>
            <Select
              value={filters.accion}
              onValueChange={(value) => handleChange("accion", value)}
            >
              <SelectTrigger id="accion">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accionesDisponibles.map((accion) => (
                  <SelectItem key={accion.value} value={accion.value}>
                    {accion.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Búsqueda de texto */}
          <div className="space-y-2">
            <Label htmlFor="searchTerm">Búsqueda</Label>
            <Input
              id="searchTerm"
              type="text"
              placeholder="Buscar en detalles..."
              value={filters.searchTerm}
              onChange={(e) => handleChange("searchTerm", e.target.value)}
            />
          </div>

          {/* Selector de Usuario */}
          <div className="space-y-2">
            <Label htmlFor="idUsuario">Usuario</Label>
            <Select
              value={filters.idUsuario}
              onValueChange={(value) => handleChange("idUsuario", value)}
              disabled={loadingUsers}
            >
              <SelectTrigger id="idUsuario">
                <SelectValue placeholder={loadingUsers ? "Cargando..." : "Todos los usuarios"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los usuarios</SelectItem>
                {usuarios.map((user) => (
                  <SelectItem
                    key={user.idUsuario}
                    value={user.idUsuario.toString()}
                  >
                    {user.nombre} {user.apellido} ({user.usuario})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros de fecha en una sola fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Fecha desde */}
          <div className="space-y-2">
            <Label htmlFor="from">Fecha desde</Label>
            <Input
              id="from"
              type="datetime-local"
              value={filters.from}
              onChange={(e) => handleChange("from", e.target.value)}
            />
          </div>

          {/* Fecha hasta */}
          <div className="space-y-2">
            <Label htmlFor="to">Fecha hasta</Label>
            <Input
              id="to"
              type="datetime-local"
              value={filters.to}
              onChange={(e) => handleChange("to", e.target.value)}
            />
          </div>
        </div>

        {/* Error de fechas */}
        {dateError && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {dateError}
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Button
            onClick={handleSearch}
            disabled={isLoading || !!dateError}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Buscar
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            disabled={isLoading}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

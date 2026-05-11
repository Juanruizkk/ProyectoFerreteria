// ─── Date & Time ─────────────────────────────────────────────────────────────

export function formatDateTime(isoString) {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `Hace ${days}d`;
  return formatDateTime(isoString);
}

// ─── Action config ────────────────────────────────────────────────────────────

const ACTION_MAP = {
  // Semánticas
  CREACION:            { label: "Creación",           verb: "creó",                         color: "emerald" },
  ACTUALIZACION:       { label: "Actualización",       verb: "actualizó",                    color: "blue"    },
  BAJA:                { label: "Baja",                verb: "dio de baja",                  color: "red"     },
  REACTIVACION:        { label: "Reactivación",        verb: "reactivó",                     color: "purple"  },
  PRECIO_ACTUALIZADO:  { label: "Precio actualizado",  verb: "actualizó el precio de",       color: "amber"   },
  NOMBRE_ACTUALIZADO:  { label: "Nombre actualizado",  verb: "actualizó el nombre de",       color: "amber"   },
  STOCK_INGRESO:       { label: "Ingreso de stock",    verb: "registró ingreso de stock en", color: "teal"    },
  STOCK_EGRESO:        { label: "Egreso de stock",     verb: "registró egreso de stock en",  color: "orange"  },
  AJUSTE_STOCK:        { label: "Ajuste de stock",     verb: "ajustó el stock de",           color: "amber"   },
  IMPORTACION_PRECIOS:          { label: "Import. precios",        verb: "importó precios para",                color: "indigo"  },
  ACTUALIZACION_PRECIOS_MANUAL: { label: "Actualiz. precios",      verb: "actualizó precios masivamente en",    color: "amber"   },
  ACTUALIZACION_PRECIOS_EXCEL:  { label: "Actualiz. precios Excel", verb: "actualizó precios vía Excel en",     color: "amber"   },
  CC_CREADA:           { label: "CC creada",           verb: "creó la cuenta corriente de",  color: "teal"    },
  VENTA_REGISTRADA:    { label: "Venta registrada",    verb: "registró una venta para",      color: "blue"    },
  VENTA_PENDIENTE:     { label: "Venta pendiente",     verb: "generó una venta pendiente para", color: "amber" },
  VENTA_ANULADA:       { label: "Venta anulada",       verb: "anuló la venta de",            color: "red"     },
  COMPRA_REGISTRADA:   { label: "Compra registrada",   verb: "registró una compra a",        color: "indigo"  },
  COMPRA_ANULADA:      { label: "Compra anulada",      verb: "anuló la compra de",           color: "red"     },
  "CAMBIO_CONTRASEÑA": { label: "Cambio contraseña",   verb: "cambió la contraseña de",      color: "purple"  },
  CONSULTA_REPORTE:    { label: "Consulta reporte",    verb: "consultó un reporte de",       color: "slate"   },
  // Genéricas (sistema)
  INSERT:              { label: "Creación",            verb: "creó",                         color: "emerald" },
  UPDATE:              { label: "Actualización",       verb: "actualizó",                    color: "blue"    },
  DELETE:              { label: "Eliminación",         verb: "eliminó",                      color: "red"     },
};

const COLOR_CLASSES = {
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500"  },
  blue:    { bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"     },
  red:     { bg: "bg-red-100",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500"      },
  purple:  { bg: "bg-purple-100",  text: "text-purple-700",  border: "border-purple-200",  dot: "bg-purple-500"   },
  amber:   { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"    },
  teal:    { bg: "bg-teal-100",    text: "text-teal-700",    border: "border-teal-200",    dot: "bg-teal-500"     },
  orange:  { bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-200",  dot: "bg-orange-500"   },
  indigo:  { bg: "bg-indigo-100",  text: "text-indigo-700",  border: "border-indigo-200",  dot: "bg-indigo-500"   },
  slate:   { bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-400"    },
};

export function getActionConfig(accion) {
  return ACTION_MAP[accion] ?? { label: accion, verb: "realizó una acción en", color: "slate" };
}

export function getActionColors(accion) {
  const cfg = getActionConfig(accion);
  return COLOR_CLASSES[cfg.color] ?? COLOR_CLASSES.slate;
}

// ─── Entity config ────────────────────────────────────────────────────────────

const ENTITY_MAP = {
  PRODUCTO:              { label: "el producto",                 labelPlain: "Producto"                    },
  CLIENTE:               { label: "el cliente",                  labelPlain: "Cliente"                     },
  VENTA:                 { label: "la venta",                    labelPlain: "Venta"                       },
  USUARIO:               { label: "el usuario",                  labelPlain: "Usuario"                     },
  PROVEEDOR:             { label: "el proveedor",                labelPlain: "Proveedor"                   },
  COMPRA:                { label: "la compra",                   labelPlain: "Compra"                      },
  // Datos maestros
  CATEGORIA:             { label: "la categoría",               labelPlain: "Categoría"                   },
  UBICACION:             { label: "la ubicación",               labelPlain: "Ubicación"                   },
  TIPO_MOVIMIENTO_STOCK: { label: "el tipo de movimiento",      labelPlain: "Tipo movimiento stock"       },
  UNIDAD_MEDIDA:         { label: "la unidad de medida",        labelPlain: "Unidad de medida"            },
  // Configuración
  CONFIGURACION_CC:      { label: "la config. de CC",           labelPlain: "Config. cuenta corriente"   },
  MOTIVO_NOTA_CREDITO:   { label: "el motivo de nota de créd.", labelPlain: "Motivo nota de crédito"     },
  MOTIVO_NOTA_DEBITO:    { label: "el motivo de nota de déb.",  labelPlain: "Motivo nota de débito"      },
  CONFIGURACION_INTERES: { label: "la config. de intereses",    labelPlain: "Config. intereses"          },
  EMPRESA:               { label: "los datos de la empresa",    labelPlain: "Empresa"                    },
};

export function getEntityConfig(entidadTipo) {
  return ENTITY_MAP[entidadTipo] ?? { label: `la entidad ${entidadTipo}`, labelPlain: entidadTipo };
}

// ─── Activity sentence ────────────────────────────────────────────────────────

export function buildActivityText(item) {
  const user   = item.usuarioNombre || "El sistema";
  const action = getActionConfig(item.accion);
  const entity = getEntityConfig(item.entidadTipo);
  const id     = item.entidadId ? ` #${item.entidadId}` : "";
  return { user, verb: action.verb, entity: entity.label, id };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500",   "bg-emerald-500", "bg-amber-500",
  "bg-pink-500",   "bg-teal-500",   "bg-indigo-500",  "bg-rose-500",
  "bg-cyan-500",   "bg-orange-500",
];

export function getUserInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getUserAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── JSON ─────────────────────────────────────────────────────────────────────

export function parseJSON(str) {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

// ─── Field value formatter ────────────────────────────────────────────────────

export function formatFieldValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object")  return JSON.stringify(value, null, 2);
  return String(value);
}

// ─── Field name humanizer ─────────────────────────────────────────────────────

const FIELD_LABELS = {
  nombre:          "Nombre",
  apellido:        "Apellido",
  email:           "Correo electrónico",
  usuario:         "Usuario",
  rol:             "Rol",
  activo:          "Activo",
  precio:          "Precio",
  stock:           "Stock",
  stockMinimo:     "Stock mínimo",
  descripcion:     "Descripción",
  categoria:       "Categoría",
  venderSinStock:  "Vender sin stock",
  limiteCredito:   "Límite de crédito",
  saldoActual:     "Saldo actual",
  tipoPago:        "Tipo de pago",
  direccion:       "Dirección",
  telefono:        "Teléfono",
  razonSocial:     "Razón social",
  cuit:            "CUIT",
  dni:             "DNI",
  fechaAlta:       "Fecha de alta",
  fechaBaja:       "Fecha de baja",
  total:           "Total",
  estado:          "Estado",
  cantidad:        "Cantidad",
  marca:           "Marca",
  ubicacion:       "Ubicación",
  password:        "Contraseña",
};

export function humanizeFieldName(key) {
  return (
    FIELD_LABELS[key] ??
    key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()
  );
}

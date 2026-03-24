export const UNIDADES_MEDIDA = {
  1: { nombre: "Unidad",      abreviatura: "u"  },
  2: { nombre: "Kilogramo",   abreviatura: "kg" },
  3: { nombre: "Litro",       abreviatura: "l"  },
  4: { nombre: "Metro",       abreviatura: "m"  },
};

/**
 * Formatea una cantidad con su unidad de medida.
 * Unidades enteras → "5 u" | Peso/medida → "1.50 kg"
 */
export function formatCantidad(valor, idUnidadMedida) {
  const unidad = UNIDADES_MEDIDA[idUnidadMedida] ?? UNIDADES_MEDIDA[1];
  const esUnidad = !idUnidadMedida || idUnidadMedida === 1;
  const num = parseFloat(valor) || 0;
  const formatted = esUnidad ? Math.round(num).toString() : num.toFixed(2);
  return `${formatted} ${unidad.abreviatura}`;
}

/** Devuelve true si la unidad permite decimales */
export function esUnidadDecimal(idUnidadMedida) {
  return idUnidadMedida !== undefined && idUnidadMedida !== null && Number(idUnidadMedida) !== 1;
}

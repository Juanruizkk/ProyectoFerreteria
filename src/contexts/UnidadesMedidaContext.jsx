import { createContext, useContext, useState, useEffect } from "react"
import { fetchUnidadesMedida } from "@/services/UnidadMedidaQueries"

const UnidadesMedidaContext = createContext(null)

export function UnidadesMedidaProvider({ children }) {
  const [unidades, setUnidades] = useState([])

  useEffect(() => {
    fetchUnidadesMedida().then(setUnidades).catch(() => {})
  }, [])

  const getUnidad = (id) =>
    unidades.find((u) => Number(u.idUnidadMedida) === Number(id))

  const getAbreviatura = (id) => {
    if (!id) return "u"
    return getUnidad(id)?.abreviatura ?? "u"
  }

  const esDecimal = (id) => {
    if (!id) return false
    return getUnidad(id)?.abreviatura !== "u"
  }

  const formatCantidad = (valor, idUnidadMedida) => {
    const abrev = getAbreviatura(idUnidadMedida)
    const decimal = esDecimal(idUnidadMedida)
    const num = parseFloat(valor) || 0
    const formatted = decimal ? num.toFixed(2) : Math.round(num).toString()
    return `${formatted} ${abrev}`
  }

  const refreshUnidades = () =>
    fetchUnidadesMedida().then(setUnidades).catch(() => {})

  return (
    <UnidadesMedidaContext.Provider value={{ unidades, getUnidad, getAbreviatura, esDecimal, formatCantidad, refreshUnidades }}>
      {children}
    </UnidadesMedidaContext.Provider>
  )
}

export function useUnidadesMedida() {
  return useContext(UnidadesMedidaContext)
}

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AccountMovementsTable from "./AccountMovementsTable";
import PaginationControls from "../Common/PaginationControls";
import { getMovementTypes } from "@/services/CurrentAccountQueries";
import { toast } from "sonner";

const TYPE_LABELS = {
  3: "Nota de Débito",
  5: "Consumo CC (Venta)",
  6: "Pago Global",
  7: "Interés por Mora",
  8: "Pago por Factura",
  9: "Anulación pago",
  10: "Modificación de Límite",
  11: "Pago Parcial",
};

const formatTypeName = (nombre) =>
  nombre
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function CurrentAccountMovementsSection({
  movementsData,
  loadingMovements,
  limiteTotal,
  
  searchTerm,
  setSearchTerm,
  pageIndex,
  setPageIndex,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  movementType,
  setMovementType,

  onPayConsumption,
  onViewReceipt,
  onMovementsChanged,
  onPriceAdjustment,
}) {
  const [types, setTypes] = useState([]);
  
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const data = await getMovementTypes();
        // El en backend excluyen los internos (2,7), y si 5 (movimiento_cc) no viene, 
        // el usuario dijo: "Si querés incluir el 5 en el filtro del front, hardcodealo."
        
        let availableTypes = [...data].filter(t => t.idTipoMovimiento !== 4);
        if (!availableTypes.find(t => t.idTipoMovimiento === 5)) {
            availableTypes.push({ idTipoMovimiento: 5, nombre: "Consumo CC (venta)" });
        }
        
        // Sorting para que queden presentables por nombre
        availableTypes.sort((a,b) => {
          const nameA = TYPE_LABELS[a.idTipoMovimiento] || a.nombre;
          const nameB = TYPE_LABELS[b.idTipoMovimiento] || b.nombre;
          return nameA.localeCompare(nameB);
        });
        
        setTypes(availableTypes);
      } catch {
        toast.error("Error al cargar los tipos de movimiento.");
      }
    };
    fetchTypes();
  }, []);

  const items = movementsData?.items || [];
  const totalPages = movementsData?.totalPages || 1;
  const totalCount = movementsData?.totalCount || 0;

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por detalle o venta..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtro por Tipo */}
        <Select value={movementType} onValueChange={setMovementType}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de movimiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {types.map((type) => (
              <SelectItem key={type.idTipoMovimiento} value={String(type.idTipoMovimiento)}>
                {TYPE_LABELS[type.idTipoMovimiento] || formatTypeName(type.nombre)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Fecha Desde */}
        <div className="relative">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal pr-8 sm:text-sm text-xs",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">
                  {dateFrom ? format(dateFrom, "dd / MM / yyyy") : "Desde fecha..."}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {dateFrom && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-2 hover:bg-transparent text-muted-foreground"
              onClick={() => setDateFrom(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Fecha Hasta */}
        <div className="relative">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal pr-8 sm:text-sm text-xs",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">
                  {dateTo ? format(dateTo, "dd / MM / yyyy") : "Hasta fecha..."}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
                disabled={(date) => dateFrom ? date < dateFrom : false}
              />
            </PopoverContent>
          </Popover>
          {dateTo && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-2 hover:bg-transparent text-muted-foreground"
              onClick={() => setDateTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Botón para limpiar filtros si hay alguno activo */}
      {(searchTerm || dateFrom || dateTo || movementType !== "todos") && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setDateFrom(null);
              setDateTo(null);
              setMovementType("todos");
              setPageIndex(1);
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Grid de la tabla */}
      <div className="mt-4">
        {loadingMovements ? (
          <div className="flex justify-center items-center py-12 border rounded-md bg-muted/20">
            <span className="text-muted-foreground">Cargando movimientos...</span>
          </div>
        ) : (
          <>
            <AccountMovementsTable
              movements={items}
              limiteTotal={limiteTotal}
              emptyMessage="No se encontraron movimientos con los filtros actuales."
              onPayConsumption={onPayConsumption}
              onViewReceipt={onViewReceipt}
              onMovementsChanged={onMovementsChanged}
              onPriceAdjustment={onPriceAdjustment}
            />

            {/* Paginación */}
            {items.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Página {pageIndex} de {totalPages} • Total: {totalCount} movimientos
                </div>
                <PaginationControls
                  currentPage={pageIndex}
                  totalPages={totalPages}
                  onPageChange={setPageIndex}
                />
              </div>
            )}
           </>
        )}
      </div>
    </div>
  );
}

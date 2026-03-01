import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountMovementsTable from "./AccountMovementsTable";

const PAGOS_TIPOS = ["pago_global", "pago_factura"];
const AJUSTES_TIPOS = ["nota_debito", "nota_credito", "interes_saldo_global"];

export default function CurrentAccountMovementsSection({ baseMovements, limiteTotal }) {
  const consumos = baseMovements.filter((m) => m.tipoMovimiento === "movimiento_cc");
  const pagos = baseMovements.filter((m) => PAGOS_TIPOS.includes(m.tipoMovimiento));
  const ajustes = baseMovements.filter((m) => AJUSTES_TIPOS.includes(m.tipoMovimiento));

  const tabLabel = (label, count) =>
    count > 0 ? `${label} (${count})` : label;

  return (
    <Tabs defaultValue="todos">
      <TabsList>
        <TabsTrigger value="todos">
          {tabLabel("Todos", baseMovements.length)}
        </TabsTrigger>
        <TabsTrigger value="consumos">
          {tabLabel("Consumos", consumos.length)}
        </TabsTrigger>
        <TabsTrigger value="pagos">
          {tabLabel("Pagos", pagos.length)}
        </TabsTrigger>
        <TabsTrigger value="ajustes">
          {tabLabel("Ajustes", ajustes.length)}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="todos" className="mt-4">
        <AccountMovementsTable
          movements={baseMovements}
          limiteTotal={limiteTotal}
          emptyMessage="Sin movimientos aún."
        />
      </TabsContent>

      <TabsContent value="consumos" className="mt-4">
        <AccountMovementsTable
          movements={consumos}
          limiteTotal={limiteTotal}
          emptyMessage="No hay consumos registrados."
        />
      </TabsContent>

      <TabsContent value="pagos" className="mt-4">
        <AccountMovementsTable
          movements={pagos}
          limiteTotal={limiteTotal}
          emptyMessage="No hay pagos registrados."
        />
      </TabsContent>

      <TabsContent value="ajustes" className="mt-4">
        <AccountMovementsTable
          movements={ajustes}
          limiteTotal={limiteTotal}
          emptyMessage="No hay ajustes registrados."
        />
      </TabsContent>
    </Tabs>
  );
}

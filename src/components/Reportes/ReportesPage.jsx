import { useState, useEffect } from "react";
import { useUnidadesMedida } from "@/contexts/UnidadesMedidaContext";
import {
  BarChart2,
  TrendingUp,
  Package,
  Trophy,
  Search,
  ShoppingCart,
  Star,
  Tag,
  FileDown,
  Percent,
  Clock,
  CreditCard,
  Users,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PermissionGuard from "@/components/PermissionGuard";
import AccessDenied from "@/components/Common/AccessDenied";
import { PermissionGroups } from "@/config/permissions";
import {
  fetchTotalVendido,
  fetchVentasPorPeriodo,
  fetchArticuloMasVendido,
  fetchProductosMasVendidos,
  fetchCategoriasMasVendidas,
  fetchMargenUtilidad,
  fetchClientesFrecuentes,
  fetchTiempoPromedioCobro,
  fetchDeudaTotal,
  fetchClientesSaldoDeudor,
} from "@/services/ReportQueries";
import { fetchCategorias } from "@/services/CategoryQueries";

// ── Helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split("T")[0];
}

function firstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatCurrency(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

function formatCurrencyShort(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

function truncate(str, max = 9) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ── Donut chart helpers ───────────────────────────────────────────────────────

const PALETTE = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(32, 95%, 54%)",
  "hsl(291, 64%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(180, 66%, 49%)",
  "hsl(46, 96%, 56%)",
  "hsl(330, 81%, 60%)",
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, outerR, innerR, startAngle, endAngle) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const s  = polarToCartesian(cx, cy, outerR, startAngle);
  const e  = polarToCartesian(cx, cy, outerR, endAngle);
  const si = polarToCartesian(cx, cy, innerR, startAngle);
  const ei = polarToCartesian(cx, cy, innerR, endAngle);
  return [
    `M ${s.x.toFixed(3)} ${s.y.toFixed(3)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`,
    `L ${ei.x.toFixed(3)} ${ei.y.toFixed(3)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${si.x.toFixed(3)} ${si.y.toFixed(3)}`,
    "Z",
  ].join(" ");
}

// ── Donut Chart ───────────────────────────────────────────────────────────────

function DonutChart({ data }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No hay datos para el período
      </div>
    );
  }

  const cx = 150;
  const cy = 150;
  const outerR = 128;
  const innerR = 76;
  const GAP = data.length > 1 ? 1.8 : 0;

  const total = data.reduce((s, d) => s + d.totalFacturado, 0);

  let angle = 0;
  const slices = data.map((d, i) => {
    const pct = total > 0 ? d.totalFacturado / total : 1 / data.length;
    const sweep = pct * 360;
    const start = angle + GAP / 2;
    const end   = angle + sweep - GAP / 2;
    angle += sweep;
    return { ...d, start, end, pct, color: PALETTE[i % PALETTE.length] };
  });

  const active = hovered !== null ? slices[hovered] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG */}
      <div className="shrink-0">
        <svg viewBox="0 0 300 300" width={300} height={300}>
          {slices.map((s, i) => {
            const isActive = hovered === i;
            const isFull   = s.end - s.start >= 359;

            // single-slice: render as a ring with <circle>
            if (isFull) {
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={(outerR + innerR) / 2}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={outerR - innerR}
                  opacity={hovered === null || isActive ? 1 : 0.4}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            }

            return (
              <path
                key={i}
                d={arcPath(cx, cy, outerR, innerR, s.start, s.end)}
                fill={s.color}
                opacity={hovered === null || isActive ? 1 : 0.35}
                style={{ cursor: "pointer", transition: "opacity 0.18s" }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <title>{`${s.categoria}: ${formatCurrency(s.totalFacturado)} (${(s.pct * 100).toFixed(1)}%)`}</title>
              </path>
            );
          })}

          {/* Center text — hovered state */}
          {active ? (
            <>
              <text
                x={cx} y={cy - 18}
                textAnchor="middle" fontSize={12}
                fill="currentColor" fillOpacity={0.55}
                style={{ pointerEvents: "none" }}
              >
                {active.categoria.length > 16
                  ? active.categoria.slice(0, 15) + "…"
                  : active.categoria}
              </text>
              <text
                x={cx} y={cy + 6}
                textAnchor="middle" fontSize={18} fontWeight="bold"
                fill="currentColor"
                style={{ pointerEvents: "none" }}
              >
                {(active.pct * 100).toFixed(1)}%
              </text>
              <text
                x={cx} y={cy + 26}
                textAnchor="middle" fontSize={11}
                fill="currentColor" fillOpacity={0.5}
                style={{ pointerEvents: "none" }}
              >
                {formatCurrency(active.totalFacturado)}
              </text>
            </>
          ) : (
            <>
              <text
                x={cx} y={cy - 8}
                textAnchor="middle" fontSize={13}
                fill="currentColor" fillOpacity={0.4}
                style={{ pointerEvents: "none" }}
              >
                Total
              </text>
              <text
                x={cx} y={cy + 16}
                textAnchor="middle" fontSize={15} fontWeight="bold"
                fill="currentColor"
                style={{ pointerEvents: "none" }}
              >
                {formatCurrency(total)}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {slices.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer transition-all ${
              hovered !== null && hovered !== i
                ? "opacity-35"
                : hovered === i
                ? "bg-muted/60"
                : ""
            }`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: s.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{s.categoria}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(s.pct * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                {formatCurrency(s.totalFacturado)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SVG Bar Chart (Ventas por período) ───────────────────────────────────────

function BarChartSVG({ data }) {
  if (!data || data.length === 0) return null;

  const W = 800;
  const H = 320;
  const PL = 115;
  const PB = 50;
  const PT = 20;
  const PR = 20;
  const cW = W - PL - PR;
  const cH = H - PB - PT;

  const maxVal = Math.max(...data.map((d) => d.totalVendido), 1);
  const barW   = Math.min(60, (cW / data.length) * 0.55);
  const step   = cW / data.length;
  const yTicks = 5;

  const formatYTick = (n) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      aria-label="Gráfico de barras: ventas por período"
    >
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = (maxVal * i) / yTicks;
        const y   = PT + cH - (cH * i) / yTicks;
        return (
          <g key={i}>
            <line
              x1={PL} y1={y} x2={W - PR} y2={y}
              stroke="currentColor"
              strokeOpacity={i === 0 ? 0.18 : 0.07}
              strokeDasharray={i === 0 ? undefined : "4 4"}
            />
            <text
              x={PL - 8} y={y + 4}
              textAnchor="end" fontSize={10}
              fill="currentColor" fillOpacity={0.5}
            >
              {formatYTick(val)}
            </text>
          </g>
        );
      })}

      <line
        x1={PL} y1={PT} x2={PL} y2={PT + cH}
        stroke="currentColor" strokeOpacity={0.15}
      />

      {data.map((d, i) => {
        const barH = cH * (d.totalVendido / maxVal);
        const x    = PL + i * step + (step - barW) / 2;
        const y    = PT + cH - barH;
        return (
          <g key={i}>
            <title>{`${d.periodo}: ${formatCurrency(d.totalVendido)} — ${d.cantidadVentas} ventas`}</title>
            <rect
              x={x} y={y} width={barW} height={Math.max(barH, 1)}
              rx={4}
              className="fill-primary"
              style={{ opacity: 0.82 }}
            />
            <text
              x={x + barW / 2} y={H - PB + 18}
              textAnchor="middle" fontSize={11}
              fill="currentColor" fillOpacity={0.55}
            >
              {truncate(d.periodo, 10)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Horizontal Bar Chart (Top productos) ─────────────────────────────────────

function HorizontalBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.cantidadVendida), 1);
  const { formatCantidad } = useUnidadesMedida();

  return (
    <div className="flex flex-col gap-3">
      {data.map((row, i) => {
        const pct = (row.cantidadVendida / maxVal) * 100;
        return (
          <div key={row.idProducto ?? i} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-medium truncate leading-tight">
                  {row.nombreProducto}
                </span>
                <span className="text-xs text-muted-foreground shrink-0 ml-1">
                  {formatCantidad(row.cantidadVendida, row.idUnidadMedida)}
                </span>
              </div>
              <div className="h-4 bg-muted rounded overflow-hidden">
                <div
                  className="h-full rounded bg-primary/75 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, loading }) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="py-5 px-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        {loading ? (
          <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
        ) : value != null ? (
          <>
            <p className="text-2xl font-bold leading-tight break-words">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{sub}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sin datos</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function LoadingRows({ count = 5 }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-7 bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}

// ── Clientes Frecuentes Chart ─────────────────────────────────────────────────

function ClientesFrecuentesChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.cantidadCompras ?? d.cantidadVentas ?? 0), 1);

  return (
    <div className="flex flex-col gap-3">
      {data.map((row, i) => {
        const cantidad = row.cantidadCompras ?? row.cantidadVentas ?? 0;
        const nombre   = row.nombreCliente ?? row.nombre ?? `Cliente ${row.idCliente}`;
        const pct      = (cantidad / maxVal) * 100;
        return (
          <div key={row.idCliente ?? i} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-medium truncate leading-tight">{nombre}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-1">
                  {cantidad} {cantidad === 1 ? "compra" : "compras"}
                </span>
              </div>
              <div className="h-4 bg-muted rounded overflow-hidden">
                <div
                  className="h-full rounded bg-blue-500/70 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ReportesPage() {
  const [desde, setDesde]           = useState(firstDayOfMonth());
  const [hasta, setHasta]           = useState(today());
  const [agrupacion, setAgrupacion] = useState("mes");
  const [topN, setTopN]             = useState("10");
  const [idCategoria, setIdCategoria] = useState("all");
  const [categorias, setCategorias] = useState([]);

  const [loading, setLoading]         = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [tvData, setTvData]   = useState(null);
  const [vpData, setVpData]   = useState(null);
  const [amData, setAmData]   = useState(null);
  const [pmData, setPmData]   = useState(null);
  const [catData, setCatData] = useState(null);
  const [muData, setMuData]   = useState(null);
  const [cfData, setCfData]   = useState(null);
  const [tcData, setTcData]   = useState(null);
  const [dtData, setDtData]   = useState(null);
  const [cdData, setCdData]   = useState(null);

  useEffect(() => {
    fetchCategorias().then(setCategorias).catch(() => {});
  }, []);

  async function buscar() {
    setLoading(true);
    setHasSearched(true);

    const catId = idCategoria !== "all" ? Number(idCategoria) : null;

    const [tv, vp, am, pm, cat, mu, cf, tc, dt, cd] = await Promise.allSettled([
      fetchTotalVendido(desde, hasta),
      fetchVentasPorPeriodo(desde, hasta, agrupacion),
      fetchArticuloMasVendido(desde, hasta),
      fetchProductosMasVendidos(desde, hasta, Number(topN), catId),
      fetchCategoriasMasVendidas(desde, hasta),
      fetchMargenUtilidad(desde, hasta),
      fetchClientesFrecuentes(desde, hasta, Number(topN)),
      fetchTiempoPromedioCobro(desde, hasta),
      fetchDeudaTotal(),
      fetchClientesSaldoDeudor(),
    ]);

    setTvData(tv.status   === "fulfilled" ? tv.value   : null);
    setVpData(vp.status   === "fulfilled" ? vp.value   : null);
    setAmData(am.status   === "fulfilled" ? am.value   : null);
    setPmData(pm.status   === "fulfilled" ? pm.value   : null);
    setCatData(cat.status === "fulfilled" ? cat.value  : null);
    setMuData(mu.status   === "fulfilled" ? mu.value   : null);
    setCfData(cf.status   === "fulfilled" ? cf.value   : null);
    setTcData(tc.status   === "fulfilled" ? tc.value   : null);
    setDtData(dt.status   === "fulfilled" ? dt.value   : null);
    setCdData(cd.status   === "fulfilled" ? cd.value   : null);

    if ([tv, vp, am, pm, cat, mu, cf, tc, dt, cd].some((r) => r.status === "rejected")) {
      toast.error("Algunos reportes no pudieron cargarse");
    }

    setLoading(false);
  }

  const kpiTotal    = tvData ? formatCurrency(tvData.totalVendido) : null;
  const kpiVentas   = tvData != null ? String(tvData.cantidadVentas) : null;
  const kpiProducto = amData?.nombreProducto ?? null;
  const { formatCantidad } = useUnidadesMedida();
  const kpiProductoSub = amData
    ? `${formatCantidad(amData.cantidadVendida, amData.idUnidadMedida)} · ${formatCurrency(amData.totalFacturado)}`
    : null;

  const agrupacionLabel =
    { dia: "día", semana: "semana", mes: "mes" }[agrupacion] ?? agrupacion;

  function handleExportPDF() {
    window.print();
  }

  return (
    <>
      {/* ── Estilos de impresión ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #reporte-dashboard, #reporte-dashboard * { visibility: visible; }
          #reporte-dashboard {
            position: absolute;
            inset: 0;
            padding: 24px;
            background: white;
          }
          @page { margin: 1.2cm; size: A4; }
        }
      `}</style>

      <PermissionGuard
        anyOf={Object.values(PermissionGroups.REPORTS.permissions)}
        fallback={<AccessDenied moduleName="la sección de reportes" />}
      >
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6 print:hidden">
          <BarChart2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Reportes</h1>
            <p className="text-muted-foreground text-sm">
              Dashboard de ventas y estadísticas
            </p>
          </div>
        </div>

        {/* ── Filtros globales ── */}
        <Card className="mb-6 print:hidden">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Desde</Label>
                <Input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Hasta</Label>
                <Input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Agrupar por</Label>
                <Select value={agrupacion} onValueChange={setAgrupacion}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dia">Día</SelectItem>
                    <SelectItem value="semana">Semana</SelectItem>
                    <SelectItem value="mes">Mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Top productos</Label>
                <Select value={topN} onValueChange={setTopN}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Top 5</SelectItem>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="20">Top 20</SelectItem>
                    <SelectItem value="50">Top 50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Categoría (productos)</Label>
                <Select value={idCategoria} onValueChange={setIdCategoria}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c.idCategoria} value={String(c.idCategoria)}>
                        {c.categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={buscar} disabled={loading} className="gap-2">
                <Search className="h-4 w-4" />
                {loading ? "Cargando..." : "Consultar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Estado vacío inicial ── */}
        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
            <BarChart2 className="h-14 w-14 mb-4 opacity-25" />
            <p className="text-base font-medium">
              Seleccioná el período y presioná Consultar
            </p>
            <p className="text-sm opacity-60 mt-1">
              para ver el dashboard de ventas y estadísticas
            </p>
          </div>
        )}

        {/* ── Dashboard ── */}
        {hasSearched && (
          <div id="reporte-dashboard">
            {/* Header visible solo al imprimir */}
            <div className="hidden print:block mb-6 pb-4 border-b">
              <h1 className="text-2xl font-bold">Reporte de Ventas — Ferretería</h1>
              <p className="text-sm text-gray-500 mt-1">
                Período: {desde} al {hasta} · Generado el{" "}
                {new Date().toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>

          <div className="flex flex-col gap-6">
            {/* ── KPIs ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard
                icon={TrendingUp}
                label="Total vendido"
                value={kpiTotal}
                sub={tvData ? `${tvData.cantidadVentas} ventas confirmadas` : null}
                loading={loading}
              />
              <KpiCard
                icon={ShoppingCart}
                label="Cantidad de ventas"
                value={kpiVentas}
                sub="en el período seleccionado"
                loading={loading}
              />
              <KpiCard
                icon={Trophy}
                label="Artículo más vendido"
                value={kpiProducto}
                sub={kpiProductoSub}
                loading={loading}
              />
              <KpiCard
                icon={Percent}
                label="Margen de utilidad"
                value={muData != null ? `${(muData.margenPorcentaje ?? 0).toFixed(1)}%` : null}
                sub={muData?.gananciaBruta != null ? `Ganancia bruta: ${formatCurrency(muData.gananciaBruta)}` : null}
                loading={loading}
              />
              <PermissionGuard anyOf={Object.values(PermissionGroups.CURRENT_ACCOUNT.permissions)}>
                <KpiCard
                  icon={Clock}
                  label="Tiempo promedio de cobro"
                  value={tcData != null ? `${tcData.diasPromedio ?? 0} días` : null}
                  sub="Promedio en CC"
                  loading={loading}
                />
              </PermissionGuard>
              <PermissionGuard anyOf={Object.values(PermissionGroups.CURRENT_ACCOUNT.permissions)}>
                <KpiCard
                  icon={CreditCard}
                  label="Deuda total CC"
                  value={dtData != null ? formatCurrency(dtData.totalDeuda ?? dtData) : null}
                  sub="Saldo deudor acumulado"
                  loading={loading}
                />
              </PermissionGuard>
            </div>

            {/* ── Gráfico principal ── */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Ventas por período</CardTitle>
                </div>
                <CardDescription>
                  Total facturado agrupado por {agrupacionLabel}. Pasá el cursor
                  por las barras para ver el detalle.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-52 bg-muted animate-pulse rounded" />
                ) : vpData && vpData.length > 0 ? (
                  <BarChartSVG data={vpData} />
                ) : (
                  <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                    No hay ventas en el período seleccionado
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Donut categorías ── */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Ventas por categoría</CardTitle>
                </div>
                <CardDescription>
                  Distribución del total facturado por categoría. Hover para ver el detalle.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-44 h-44 bg-muted animate-pulse rounded-full" />
                    <div className="w-full flex flex-col gap-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-6 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <DonutChart data={catData} />
                )}
              </CardContent>
            </Card>

            {/* ── Bottom: chart + tabla ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Horizontal bar chart */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">
                      Top {topN} productos más vendidos
                    </CardTitle>
                  </div>
                  <CardDescription>Ordenados por unidades vendidas</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <LoadingRows count={5} />
                  ) : pmData && pmData.length > 0 ? (
                    <HorizontalBarChart data={pmData} />
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      No hay datos para el período
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tabla de detalle */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Detalle de productos</CardTitle>
                  </div>
                  <CardDescription>
                    Unidades y total facturado por producto
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <LoadingRows count={5} />
                  ) : pmData && pmData.length > 0 ? (
                    <div className="overflow-hidden rounded-b-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Unid.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pmData.map((row, i) => (
                            <TableRow key={row.idProducto ?? i}>
                              <TableCell className="text-muted-foreground font-mono text-xs">
                                {i + 1}
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {row.nombreProducto}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {row.categoria}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCantidad(row.cantidadVendida, row.idUnidadMedida)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(row.totalFacturado)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      No hay datos para el período
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Clientes: frecuentes + deudores ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clientes frecuentes */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Clientes más frecuentes</CardTitle>
                  </div>
                  <CardDescription>Ordenados por cantidad de compras en el período</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <LoadingRows count={5} />
                  ) : cfData && cfData.length > 0 ? (
                    <ClientesFrecuentesChart data={cfData} />
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      No hay datos para el período
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Clientes con saldo deudor */}
              <PermissionGuard anyOf={Object.values(PermissionGroups.CURRENT_ACCOUNT.permissions)}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <CardTitle className="text-base">Clientes con saldo deudor</CardTitle>
                    </div>
                    <CardDescription>Clientes con deuda pendiente en cuenta corriente</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <LoadingRows count={5} />
                    ) : cdData && cdData.length > 0 ? (() => {
                      const maxSaldo = Math.max(...cdData.map((c) => c.saldoDeudor ?? c.saldo ?? 0), 1);
                      return (
                        <div className="overflow-hidden rounded-b-md">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead>Cliente</TableHead>
                                <TableHead className="text-right">Saldo deudor</TableHead>
                                <TableHead className="text-right">Estado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cdData.map((row, i) => {
                                const saldo  = row.saldoDeudor ?? row.saldo ?? 0;
                                const nombre = row.nombreCliente ?? row.nombre ?? `Cliente ${row.idCliente}`;
                                const esAlto = saldo > maxSaldo * 0.5;
                                return (
                                  <TableRow key={row.idCliente ?? i} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium text-sm">{nombre}</TableCell>
                                    <TableCell className="text-right text-sm font-mono">
                                      {formatCurrency(saldo)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {esAlto ? (
                                        <Badge className="bg-red-700 text-white text-xs hover:bg-red-700">
                                          Alto
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
                                          Pendiente
                                        </Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })() : (
                      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                        No hay clientes con saldo deudor
                      </div>
                    )}
                  </CardContent>
                </Card>
              </PermissionGuard>
            </div>

            {/* ── Botón exportar ── */}
            <div className="flex justify-end pt-2 print:hidden">
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={loading}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Exportar PDF
              </Button>
            </div>

          </div>
          </div>
          
        )}
      </div>
      </PermissionGuard>
    </>
  );
}

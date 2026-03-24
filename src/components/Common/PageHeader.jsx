/**
 * PageHeader — bloque de encabezado estándar de módulo.
 *
 * Props:
 *   icon        React element  Ícono ya renderizado (ej. <Package className="h-8 w-8 text-primary" />)
 *   title       string         Título principal del módulo
 *   description string         Subtítulo / descripción breve
 *   children    React node     Acciones del lado derecho (botones, guards, etc.)
 */
export default function PageHeader({ icon, title, description, children }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="flex items-center justify-center bg-primary/10 text-primary rounded-lg p-2 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}

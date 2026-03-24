export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      {Icon && (
        <div className="flex items-center justify-center bg-muted/60 rounded-full p-3">
          <Icon className="h-8 w-8 text-muted-foreground/60" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

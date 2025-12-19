import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AccessDenied({ moduleName = "este módulo" }) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl w-full flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full">
        <CardContent className="p-12">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Acceso Denegado</h2>
              <p className="text-muted-foreground max-w-md">
                No tienes permisos para acceder a {moduleName}.
                Contacta al administrador si necesitas acceso.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="mt-4"
            >
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

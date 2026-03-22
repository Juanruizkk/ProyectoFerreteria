import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Power,
  Trash2,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import PermissionGuard from "@/components/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import {
  getProveedorById,
  fetchListasByProveedor,
  createLista,
  updateLista,
  deleteLista,
  toggleActivoLista,
} from "@/services/ProveedorQueries";

// ── Formulario de lista (create / edit) ────────────────────────────────────
const EMPTY_FORM = { nombre: "", observaciones: "" };

export default function ProveedorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  const [proveedor, setProveedor] = useState(null);
  const [loadingProveedor, setLoadingProveedor] = useState(true);

  const [listas, setListas] = useState([]);
  const [loadingListas, setLoadingListas] = useState(false);

  // Dialog crear/editar lista
  const [listaDialog, setListaDialog] = useState(false);
  const [editingLista, setEditingLista] = useState(null); // null = crear
  const [listaForm, setListaForm] = useState(EMPTY_FORM);
  const [listaFormError, setListaFormError] = useState("");
  const [savingLista, setSavingLista] = useState(false);

  // Dialog confirmar eliminar
  const deleteListaDialog = useConfirmDialog(async (lista) => {
    await deleteLista(lista.idLista);
    toast.success(`"${lista.nombre}" eliminada`);
    loadListas();
  });

  // Dialog confirmar toggle
  const toggleListaDialog = useConfirmDialog(async (lista) => {
    await toggleActivoLista(lista.idLista);
    toast.success(lista.activo ? `"${lista.nombre}" desactivada` : `"${lista.nombre}" activada`);
    loadListas();
  });

  // ── Carga ────────────────────────────────────────────────────────────────
  useEffect(() => { loadProveedor(); }, [id]);

  const loadProveedor = async () => {
    try {
      setLoadingProveedor(true);
      const data = await getProveedorById(id);
      setProveedor(data);
    } catch (err) {
      toast.error("Error al cargar el proveedor: " + err.message);
    } finally {
      setLoadingProveedor(false);
    }
  };

  const loadListas = async () => {
    try {
      setLoadingListas(true);
      const data = await fetchListasByProveedor(id);
      setListas(data ?? []);
    } catch (err) {
      toast.error("Error al cargar las listas: " + err.message);
    } finally {
      setLoadingListas(false);
    }
  };

  useEffect(() => {
    if (id) loadListas();
  }, [id]);

  // ── Handlers lista ───────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingLista(null);
    setListaForm(EMPTY_FORM);
    setListaFormError("");
    setListaDialog(true);
  };

  const openEdit = (lista) => {
    setEditingLista(lista);
    setListaForm({ nombre: lista.nombre ?? "", observaciones: lista.observaciones ?? "" });
    setListaFormError("");
    setListaDialog(true);
  };

  const handleListaSubmit = async (e) => {
    e.preventDefault();
    if (!listaForm.nombre.trim()) {
      setListaFormError("El nombre es requerido.");
      return;
    }
    try {
      setSavingLista(true);
      setListaFormError("");
      if (editingLista) {
        await updateLista({
          idLista: editingLista.idLista,
          nombre: listaForm.nombre.trim(),
          observaciones: listaForm.observaciones.trim() || null,
        });
        toast.success(`"${listaForm.nombre}" actualizada`);
      } else {
        await createLista({
          idProveedor: Number(id),
          nombre: listaForm.nombre.trim(),
          observaciones: listaForm.observaciones.trim() || null,
        });
        toast.success(`"${listaForm.nombre}" creada`);
      }
      setListaDialog(false);
      loadListas();
    } catch (err) {
      setListaFormError(err.message);
    } finally {
      setSavingLista(false);
    }
  };

  // ── Loading / not found ──────────────────────────────────────────────────
  if (loadingProveedor) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="outline" onClick={() => navigate("/proveedores")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="text-center py-12 text-muted-foreground">Cargando proveedor...</div>
      </div>
    );
  }

  if (!proveedor) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="outline" onClick={() => navigate("/proveedores")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="text-center py-12 text-muted-foreground">Proveedor no encontrado.</div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/proveedores")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <h1 className="text-2xl font-bold">Detalle del Proveedor</h1>
      </div>

      {/* Card proveedor */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{proveedor.nombre}</CardTitle>
              <CardDescription>{proveedor.direccion || "Sin dirección registrada"}</CardDescription>
            </div>
            <Badge variant={proveedor.activo ? "default" : "secondary"}>
              {proveedor.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base">{proveedor.nombre}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
              <p className="text-base">{proveedor.telefono || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dirección</p>
              <p className="text-base">{proveedor.direccion || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="listas" className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="listas">Listas de Precios</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
        </TabsList>

        {/* ── Tab Listas ─────────────────────────────────────────────────── */}
        <TabsContent value="listas" className="space-y-4">
          <PermissionGuard permission="LP_CREATE">
            <div className="flex justify-end">
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Nueva Lista
              </Button>
            </div>
          </PermissionGuard>

          <Card>
            <CardContent className="p-0">
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead>Nombre</TableHead>
                      <TableHead>Fecha de creación</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingListas ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          Cargando listas...
                        </TableCell>
                      </TableRow>
                    ) : listas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          Sin listas de precios registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      listas.map((l) => (
                        <TableRow key={l.idLista} className="hover:bg-muted/40 transition">
                          <TableCell className="font-medium">{l.nombre}</TableCell>
                          <TableCell>
                            {l.fechaCreacion
                              ? new Date(l.fechaCreacion).toLocaleDateString("es-AR")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {l.observaciones || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={l.activo ? "default" : "secondary"}>
                              {l.activo ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <div className="flex gap-2 justify-end">
                                {/* Ver detalle */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      onClick={() =>
                                        navigate(`/proveedores/${id}/listas/${l.idLista}`)
                                      }
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver productos</TooltipContent>
                                </Tooltip>

                                {/* Editar */}
                                {hasPermission("LP_UPDATE") && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => openEdit(l)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Editar</TooltipContent>
                                  </Tooltip>
                                )}

                                {/* Toggle activo */}
                                {hasPermission("LP_TOGGLE") && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => toggleListaDialog.openDialog(l)}
                                      >
                                        <Power className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {l.activo ? "Desactivar" : "Activar"}
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                {/* Eliminar — solo si la lista no tiene productos */}
                                {hasPermission("LP_DELETE") && l.cantidadItems === 0 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => deleteListaDialog.openDialog(l)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Eliminar</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab Compras ────────────────────────────────────────────────── */}
        <TabsContent value="compras" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead>Producto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio unitario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        Sin compras registradas para este proveedor
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialog: crear / editar lista ───────────────────────────────────── */}
      <Dialog open={listaDialog} onOpenChange={(v) => { if (!savingLista) setListaDialog(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLista ? "Editar Lista de Precios" : "Nueva Lista de Precios"}
            </DialogTitle>
            <DialogDescription>
              {editingLista
                ? `Modificando "${editingLista.nombre}"`
                : `Creando una lista para ${proveedor.nombre}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleListaSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="lista-nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lista-nombre"
                placeholder="Ej: Lista Marzo 2025"
                value={listaForm.nombre}
                onChange={(e) => setListaForm((p) => ({ ...p, nombre: e.target.value }))}
                disabled={savingLista}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lista-obs">Observaciones</Label>
              <Textarea
                id="lista-obs"
                placeholder="Observaciones opcionales..."
                value={listaForm.observaciones}
                onChange={(e) => setListaForm((p) => ({ ...p, observaciones: e.target.value }))}
                disabled={savingLista}
                rows={3}
              />
            </div>

            {listaFormError && (
              <p className="text-sm text-destructive">{listaFormError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setListaDialog(false)}
                disabled={savingLista}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingLista}>
                {savingLista ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog: eliminar lista ────────────────────────────────────── */}
      <AlertDialog open={deleteListaDialog.open} onOpenChange={deleteListaDialog.closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar lista?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar{" "}
              <span className="font-semibold text-foreground">
                "{deleteListaDialog.item?.nombre}"
              </span>
              ? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteListaDialog.loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteListaDialog.confirm}
              disabled={deleteListaDialog.loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteListaDialog.loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── AlertDialog: toggle lista ──────────────────────────────────────── */}
      <AlertDialog open={toggleListaDialog.open} onOpenChange={toggleListaDialog.closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleListaDialog.item?.activo ? "¿Desactivar lista?" : "¿Activar lista?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleListaDialog.item?.activo
                ? `"${toggleListaDialog.item?.nombre}" quedará como inactiva.`
                : `"${toggleListaDialog.item?.nombre}" volverá a estar activa.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleListaDialog.loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={toggleListaDialog.confirm}
              disabled={toggleListaDialog.loading}
            >
              {toggleListaDialog.loading
                ? "Procesando..."
                : toggleListaDialog.item?.activo
                ? "Desactivar"
                : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

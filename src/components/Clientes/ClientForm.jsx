import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchAccountConfigs } from "@/services/AccountConfigQueries";
import { getCurrentUser } from "@/services/AuthService";

export default function ClientForm({ initialData, onSubmit, onCancel }) {
  const isEditMode = !!initialData;
  const currentUser = getCurrentUser();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    esEmpresa: false,
    razonSocial: "",
    dni: "",
    cuit: "",
    telefono: "",
    mail: "",
    tieneCuentaCorriente: false,
    limiteCuenta: null,
    saldoInicial: "",
    idUsuarioRegistra: currentUser?.userId || 1,
  });

  const [accountConfigs, setAccountConfigs] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null); // Error general de la API
  const [submitting, setSubmitting] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  // Cargar configuraciones de cuenta corriente al montar
  useEffect(() => {
    loadAccountConfigs();
  }, []);

  // Cargar datos iniciales si es edición
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || "",
        apellido: initialData.apellido || "",
        esEmpresa: initialData.esEmpresa || false,
        razonSocial: initialData.razonSocial || "",
        dni: initialData.dni || "",
        cuit: initialData.cuit || "",
        telefono: initialData.telefono || "",
        mail: initialData.mail || "",
        tieneCuentaCorriente: initialData.tieneCuentaCorriente || false,
        limiteCuenta: initialData.limiteCuenta || null,
        saldoInicial: initialData.saldoInicial ?? "",
        idUsuarioRegistra: initialData.idUsuarioRegistra || currentUser?.userId || 1,
      });
    } else {
      // Resetear formulario si no hay initialData
      setFormData({
        nombre: "",
        apellido: "",
        esEmpresa: false,
        razonSocial: "",
        dni: "",
        cuit: "",
        telefono: "",
        mail: "",
        tieneCuentaCorriente: false,
        limiteCuenta: null,
        saldoInicial: "",
        idUsuarioRegistra: currentUser?.userId || 1,
      });
    }
  }, [initialData?.idCliente]);

  const loadAccountConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const configs = await fetchAccountConfigs();
      setAccountConfigs(configs);
    } catch (error) {
      console.error("Error al cargar configuraciones de cuenta:", error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }

    // Limpiar error de API cuando el usuario empieza a escribir
    if (apiError) {
      setApiError(null);
    }
  };

  // Manejar el cambio de "Es empresa"
  const handleEsEmpresaChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      esEmpresa: checked,
      // Limpiar campos que no aplican según el tipo
      ...(checked
        ? {
            // Si es empresa, limpia nombre, apellido y DNI
            nombre: "",
            apellido: "",
            dni: ""
          }
        : {
            // Si es persona, limpia razón social y CUIT
            razonSocial: "",
            cuit: ""
          }
      ),
    }));

    // Limpiar errores relacionados
    setErrors((prev) => ({
      ...prev,
      nombre: null,
      apellido: null,
      dni: null,
      razonSocial: null,
      cuit: null,
    }));
  };

  // Manejar el cambio de "Tiene cuenta corriente"
  const handleTieneCuentaCorrienteChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      tieneCuentaCorriente: checked,
      // Si se deshabilita, limpiar límite y saldo
      ...(!checked && { limiteCuenta: null, saldoInicial: 0 }),
    }));

    // Limpiar errores relacionados
    setErrors((prev) => ({
      ...prev,
      limiteCuenta: null,
      saldoInicial: null,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Campos SIEMPRE requeridos
    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    }

    if (!formData.mail.trim()) {
      newErrors.mail = "El email es requerido";
    } else {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.mail)) {
        newErrors.mail = "Ingrese un email válido";
      }
    }

    // Validaciones según tipo (persona física o empresa)
    if (formData.esEmpresa) {
      // Es empresa: requiere razón social y CUIT
      if (!formData.razonSocial.trim()) {
        newErrors.razonSocial = "La razón social es requerida para empresas";
      }

      if (!formData.cuit.trim()) {
        newErrors.cuit = "El CUIT es requerido para empresas";
      }
    } else {
      // Es persona física: requiere nombre, apellido y DNI
      if (!formData.nombre.trim()) {
        newErrors.nombre = "El nombre es requerido para clientes comunes";
      }

      if (!formData.apellido.trim()) {
        newErrors.apellido = "El apellido es requerido para clientes comunes";
      }

      if (!formData.dni.trim()) {
        newErrors.dni = "El DNI es requerido para clientes comunes";
      }
    }

    // Validaciones de cuenta corriente - Solo en modo creación
    if (!isEditMode && formData.tieneCuentaCorriente) {
      if (!formData.limiteCuenta || formData.limiteCuenta <= 0) {
        newErrors.limiteCuenta =
          "Debe seleccionar un límite de cuenta corriente";
      }

      if (formData.saldoInicial !== "" && isNaN(parseFloat(formData.saldoInicial))) {
        newErrors.saldoInicial = "El saldo inicial debe ser un número válido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setApiError(null); // Limpiar error previo

    try {
      let dataToSend;

      if (isEditMode) {
        // Payload para UPDATE - ClientUpdateDTO
        dataToSend = {
          // Campos obligatorios solo para cliente común (cuando EsEmpresa == false)
          nombre: formData.esEmpresa ? "" : formData.nombre,
          apellido: formData.esEmpresa ? "" : formData.apellido,
          dni: formData.esEmpresa ? "" : formData.dni,

          esEmpresa: formData.esEmpresa,

          // Campos obligatorios solo para empresa (cuando EsEmpresa == true)
          razonSocial: formData.esEmpresa ? formData.razonSocial : "",
          cuit: formData.esEmpresa ? formData.cuit : "",

          // Campos siempre obligatorios
          telefono: formData.telefono,
          mail: formData.mail,
        };
      } else {
        // Payload para CREATE - ClientCreateDTO
        dataToSend = {
          // Campos obligatorios solo para cliente común (cuando EsEmpresa == false)
          nombre: formData.esEmpresa ? "" : formData.nombre,
          apellido: formData.esEmpresa ? "" : formData.apellido,
          dni: formData.esEmpresa ? "" : formData.dni,

          esEmpresa: formData.esEmpresa,

          // Campos obligatorios solo para empresa (cuando EsEmpresa == true)
          razonSocial: formData.esEmpresa ? formData.razonSocial : "",
          cuit: formData.esEmpresa ? formData.cuit : "",

          // Campos siempre obligatorios
          telefono: formData.telefono,
          mail: formData.mail,

          // Cuenta corriente opcional (solo en creación)
          tieneCuentaCorriente: formData.tieneCuentaCorriente,
          limiteCuenta: formData.tieneCuentaCorriente
            ? formData.limiteCuenta
            : null,
          saldoInicial: formData.tieneCuentaCorriente
            ? parseFloat(formData.saldoInicial) || 0
            : null,

          idUsuarioRegistra: formData.idUsuarioRegistra,
        };
      }

      await onSubmit(dataToSend);
    } catch (error) {
      console.error("Error en submit:", error);
      // Mostrar el mensaje de error de la API
      setApiError(error.message || "Error al procesar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Editar Cliente" : "Nuevo Cliente"}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? "Actualiza la información del cliente"
            : "Completa los datos para registrar un nuevo cliente"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de cliente - Solo mostrar en modo creación */}
          {!isEditMode && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tipo de Cliente</h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="esEmpresa"
                  checked={formData.esEmpresa}
                  onCheckedChange={handleEsEmpresaChange}
                />
                <Label htmlFor="esEmpresa" className="cursor-pointer">
                  ¿Es empresa?
                </Label>
              </div>
            </div>
          )}

          {/* Datos personales / Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {formData.esEmpresa
                ? "Datos de la Empresa"
                : "Datos Personales"}
            </h3>

            {formData.esEmpresa ? (
              // Campos para EMPRESA - Solo Razón Social
              <div className="space-y-2">
                <Label htmlFor="razonSocial">
                  Razón Social <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="razonSocial"
                  value={formData.razonSocial}
                  onChange={(e) =>
                    handleChange("razonSocial", e.target.value)
                  }
                  placeholder="Razón social de la empresa"
                />
                {errors.razonSocial && (
                  <p className="text-sm text-destructive">
                    {errors.razonSocial}
                  </p>
                )}
              </div>
            ) : (
              // Campos para PERSONA FÍSICA
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleChange("nombre", e.target.value)}
                    placeholder="Nombre de la persona"
                  />
                  {errors.nombre && (
                    <p className="text-sm text-destructive">{errors.nombre}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido">
                    Apellido <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => handleChange("apellido", e.target.value)}
                    placeholder="Apellido de la persona"
                  />
                  {errors.apellido && (
                    <p className="text-sm text-destructive">
                      {errors.apellido}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Identificación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Identificación</h3>

            {formData.esEmpresa ? (
              // Solo CUIT para empresas
              <div className="space-y-2">
                <Label htmlFor="cuit">
                  CUIT <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cuit"
                  value={formData.cuit}
                  onChange={(e) => handleChange("cuit", e.target.value)}
                  placeholder="20-12345678-9"
                />
                {errors.cuit && (
                  <p className="text-sm text-destructive">{errors.cuit}</p>
                )}
              </div>
            ) : (
              // Solo DNI para personas físicas
              <div className="space-y-2">
                <Label htmlFor="dni">
                  DNI <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dni"
                  value={formData.dni}
                  onChange={(e) => handleChange("dni", e.target.value.replace(/\D/g, ""))}
                  placeholder="12345678"
                  inputMode="numeric"
                  maxLength={8}
                />
                {errors.dni && (
                  <p className="text-sm text-destructive">{errors.dni}</p>
                )}
              </div>
            )}
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datos de Contacto</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value.replace(/\D/g, ""))}
                  placeholder="3815551234"
                  inputMode="numeric"
                  maxLength={15}
                />
                {errors.telefono && (
                  <p className="text-sm text-destructive">{errors.telefono}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mail">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mail"
                  type="email"
                  value={formData.mail}
                  onChange={(e) => handleChange("mail", e.target.value)}
                  placeholder="cliente@ejemplo.com"
                />
                {errors.mail && (
                  <p className="text-sm text-destructive">{errors.mail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Cuenta Corriente - Solo mostrar en modo creación */}
          {!isEditMode && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cuenta Corriente</h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tieneCuentaCorriente"
                  checked={formData.tieneCuentaCorriente}
                  onCheckedChange={handleTieneCuentaCorrienteChange}
                />
                <Label
                  htmlFor="tieneCuentaCorriente"
                  className="cursor-pointer"
                >
                  ¿Crear cuenta corriente?
                </Label>
              </div>

              {formData.tieneCuentaCorriente && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="limiteCuenta">
                      Límite de Cuenta <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.limiteCuenta?.toString() || ""}
                      onValueChange={(value) =>
                        handleChange("limiteCuenta", parseFloat(value))
                      }
                      disabled={loadingConfigs}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingConfigs
                              ? "Cargando..."
                              : "Seleccione un límite"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {accountConfigs.map((config) => (
                          <SelectItem
                            key={config.idConfig}
                            value={config.montoLimite.toString()}
                          >
                            {config.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.limiteCuenta && (
                      <p className="text-sm text-destructive">
                        {errors.limiteCuenta}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saldoInicial">Saldo Inicial</Label>
                    <Input
                      id="saldoInicial"
                      type="text"
                      inputMode="decimal"
                      value={formData.saldoInicial}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleChange("saldoInicial", e.target.value)}
                      placeholder="0.00"
                    />
                    {errors.saldoInicial && (
                      <p className="text-sm text-destructive">
                        {errors.saldoInicial}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Positivo = deuda del cliente. Negativo = saldo a favor del cliente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mensaje de error de la API */}
          {apiError && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
              <p className="text-sm font-medium">{apiError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? isEditMode
                  ? "Actualizando..."
                  : "Guardando..."
                : isEditMode
                ? "Actualizar Cliente"
                : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

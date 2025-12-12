# Gestión de Movimientos de Cuenta Corriente

## Descripción General
Implementación de un sistema para gestionar diferentes tipos de movimientos de cuenta corriente para clientes. Por ahora se enfoca en el tipo de movimiento "pago_global".

## Tipos de Movimientos

Los tipos de movimientos se obtienen desde el endpoint:
```
GET http://localhost:5019/api/CurrentAccount/movement-types
```

### Respuesta del Endpoint
```json
[
  {
    "idTipoMovimiento": 3,
    "nombre": "nota_debito",
    "accion": "Aplica interes a una cuenta por mora. Aumenta saldo adeudado, disminuye el liminte de cc"
  },
  {
    "idTipoMovimiento": 4,
    "nombre": "nota_credito",
    "accion": "Aplica interes a una cuenta por mora. Aumenta saldo adeudado, disminuye el liminte de cc"
  },
  {
    "idTipoMovimiento": 7,
    "nombre": "interes_saldo_global",
    "accion": "Aplica interes a una cuenta por mora. Aumenta saldo adeudado, disminuye el liminte de cc"
  },
  {
    "idTipoMovimiento": 6,
    "nombre": "pago_global",
    "accion": "Aplica interes a una cuenta por mora. Aumenta saldo adeudado, disminuye el liminte de cc"
  },
  {
    "idTipoMovimiento": 8,
    "nombre": "pago_factura",
    "accion": "Disminuye deuda - Aumenta limite"
  }
]
```

## Funcionamiento de Pago Global

### Conceptos Básicos
- **Saldo Actual**: El monto que debe el cliente (aparece en el último movimiento)
- **Límite de Cuenta Corriente**: Es el "crédito" disponible del cliente
- **Primer Movimiento**: Alta de cuenta con saldo 0, importe 0, y límite configurado

### Ejemplo de Flujo

1. **Alta de cuenta**:
   - Saldo: 0
   - Importe: 0
   - Límite CC: 1000

2. **Cliente realiza compras** (usa crédito):
   - Compras por $500
   - Último registro:
     - Importe: (última compra)
     - Saldo Actual: $500
     - Límite CC: $500 (disminuido en el importe de la venta)

3. **Pago Total** ($500):
   - Deuda: $0
   - Límite restaurado: $1000

4. **Pago Parcial** ($200):
   - Deuda: $300
   - Límite restaurado: $700 (aumenta en el monto pagado)

### Caso Especial: Saldo 0 (Pago a Favor del Cliente)

Cuando el cliente no tiene deuda (saldo = 0), aún puede realizar pagos que quedarán a favor:

**Ejemplo:**
- Saldo Actual: $0
- Cliente paga: $300
- Resultado:
  - Saldo: -$300 (a favor del cliente)
  - Límite aumentado en $300

Este mecanismo permite que el cliente tenga un "crédito" adicional en su cuenta corriente.

### Cálculo del Pago (Strategy Pattern)

```csharp
public class PaymentStrategy : IMovementStrategy
{
    public CalculationResult Calculate(decimal oldBalance, decimal oldLimit, decimal amount)
    {
        decimal newBalance = oldBalance - amount;  // Disminuye la deuda
        decimal newLimit = oldLimit + amount;      // Aumenta el límite disponible

        return new CalculationResult(newBalance, newLimit);
    }
}
```

## Endpoint para Registrar Movimiento

```
POST http://localhost:5019/api/CurrentAccount/register-movement
```

### DTO (Data Transfer Object)

```csharp
public class AddMovementDTO : IValidatableObject
{
    [Required]
    public int IdCliente { get; set; }

    [Required]
    public decimal Importe { get; set; }

    [Required]
    public string Detalle { get; set; }

    [Required]
    public int IdTipoMovimiento { get; set; }

    [Required]
    public int IdVenta { get; set; }

    [Required]
    public int IdUsuarioRegistra { get; set; } = 1;

    // Validaciones:
    // - Importe debe ser > 0
    // - Si IdTipoMovimiento == 8 (pago_factura), IdVenta es requerido
}
```

### Lógica Backend

1. Obtiene el último movimiento del cliente
2. Extrae el saldo base y límite base del último movimiento
3. Aplica la estrategia según el tipo de movimiento
4. Calcula nuevo saldo y nuevo límite
5. Crea y registra el nuevo movimiento con fecha actual

## Implementación Frontend

### Ubicación
- **Página**: `ClientDetailsPage.jsx`
- **Sección**: Dentro del Card de "Cuenta Corriente" cuando el cliente tiene cuenta corriente

### Componentes a Crear

1. **Botón "Gestionar Cuenta"**
   - Ubicación: Arriba de la tabla de movimientos, a la derecha
   - Abre el formulario de gestión de movimientos

2. **Formulario de Gestión de Movimientos** (reutilizable)
   - Selector de tipo de acción (por ahora solo "pago_global" habilitado)
   - Muestra la descripción de la acción seleccionada
   - Campos dinámicos según el tipo de acción seleccionada

3. **Para Pago Global**:
   - Opciones:
     - **Pago Parcial**: Campo para ingresar monto
     - **Pago Total**: Auto-rellena el monto con el saldo actual de la CC
   - Campo de detalle (opcional o auto-generado)
   - Muestra información del saldo actual antes del pago

### Datos Necesarios

Para el formulario necesitamos:
- `IdCliente`: Obtenido del contexto (params)
- `Importe`: Ingresado por el usuario o auto-calculado (pago total)
- `Detalle`: Ingresado por usuario o auto-generado
- `IdTipoMovimiento`: 6 (para pago_global)
- `IdVenta`: ¿Valor para pago_global? (pendiente de confirmación)
- `IdUsuarioRegistra`: ¿Sistema de auth o valor fijo 1? (pendiente de confirmación)

## Respuestas a Preguntas

1. **IdUsuarioRegistra**: Valor fijo 1 por ahora (hasta que se implemente autenticación)
2. **IdVenta**: 0 (los pagos globales no están asociados a una venta específica, backend espera int no nullable)
3. **Detalle**: Auto-generado según el tipo de pago:
   - Pago Total: "Pago total de cuenta corriente - $[monto]"
   - Pago Parcial: "Pago parcial de cuenta corriente - $[monto]"
   - Pago a Favor (saldo 0): "Pago a favor del cliente - $[monto]"

## Archivos Modificados/Creados

- [x] `src/services/CurrentAccountQueries.js` - Agregadas funciones `getMovementTypes()` y `registerMovement()`
- [x] `src/components/Clientes/ClientDetailsPage.jsx` - Agregado botón "Gestionar Cuenta" y diálogo
- [x] `src/components/Clientes/ManageAccountMovementForm.jsx` - Nuevo componente de formulario creado
- [x] `claude/cuenta-corriente-movimientos.md` - Este archivo de documentación

## Resumen de la Implementación

### 1. Servicios Agregados (`CurrentAccountQueries.js`)

**getMovementTypes()**
- Endpoint: `GET /api/CurrentAccount/movement-types`
- Retorna array de tipos de movimientos disponibles
- Usado para poblar el selector en el formulario

**registerMovement(movementData)**
- Endpoint: `POST /api/CurrentAccount/register-movement`
- Parámetros:
  - `idCliente`: ID del cliente
  - `importe`: Monto del movimiento
  - `detalle`: Descripción auto-generada
  - `idTipoMovimiento`: ID del tipo de movimiento (6 para pago_global)
  - `idVenta`: 0 para pagos globales (backend no acepta null)
  - `idUsuarioRegistra`: 1 (hasta implementar autenticación)

### 2. Componente de Formulario (`ManageAccountMovementForm.jsx`)

**Características:**
- Dialog modal reutilizable
- Carga dinámica de tipos de movimiento
- Solo "pago_global" habilitado (otros deshabilitados con etiqueta "Próximamente")
- Muestra saldo actual del cliente
- **Manejo de pagos según saldo:**
  - **Si saldo > 0**: Muestra dos opciones de pago:
    - **Pago Total**: Auto-completa con saldo actual
    - **Pago Parcial**: Permite ingresar un monto específico
  - **Si saldo = 0**:
    - Muestra nota informativa sobre pago a favor
    - Solo permite ingreso manual de monto
    - El pago aumentará el límite de cuenta corriente
- Validaciones:
  - Monto > 0
  - Monto <= Saldo Actual (solo si saldo > 0)
- Detalle auto-generado según tipo de pago
- Preview del detalle antes de enviar
- Manejo de errores con toasts
- Estados de carga (loading, submitting)

**Props:**
- `open`: Controla visibilidad del diálogo
- `onClose`: Callback para cerrar el diálogo
- `clientId`: ID del cliente
- `currentBalance`: Saldo actual de la cuenta
- `onMovementRegistered`: Callback para recargar movimientos después de registrar

### 3. Modificaciones en `ClientDetailsPage.jsx`

**Cambios:**
- Importado componente `ManageAccountMovementForm`
- Agregado icono `Settings` de lucide-react
- Agregado estado `showManageMovementForm`
- Agregada función `getCurrentBalance()` - Obtiene saldo del último movimiento
- Agregada función `handleMovementRegistered()` - Recarga movimientos tras registrar
- Agregado botón "Gestionar Cuenta" junto al botón "Actualizar"
- Agregado componente `ManageAccountMovementForm` al final del return

**Ubicación del botón:**
- Aparece arriba de la tabla de movimientos
- A la derecha, junto al botón "Actualizar"
- Solo visible cuando el cliente tiene cuenta corriente y los movimientos están visibles

## Flujo de Usuario

### Caso 1: Cliente con deuda (saldo > 0)

1. Usuario navega a detalles del cliente
2. Si cliente tiene CC, ve tabla de movimientos
3. Click en botón "Gestionar Cuenta"
4. Se abre diálogo con:
   - Saldo actual destacado
   - Selector de tipo de movimiento (solo pago_global activo)
   - Descripción de la acción
   - Opciones de pago (total/parcial)
   - Campo de monto (auto-completado para pago total o manual para parcial)
   - Preview del detalle
5. Usuario completa formulario y envía
6. Sistema valida y registra el movimiento
7. Muestra toast de confirmación
8. Recarga tabla de movimientos automáticamente
9. Cierra el diálogo

### Caso 2: Cliente sin deuda (saldo = 0)

1. Usuario navega a detalles del cliente
2. Si cliente tiene CC, ve tabla de movimientos mostrando saldo $0,00
3. Click en botón "Gestionar Cuenta"
4. Se abre diálogo con:
   - Saldo actual $0,00 destacado
   - Selector de tipo de movimiento (solo pago_global activo)
   - Nota informativa: "El cliente no tiene deuda. Cualquier pago quedará a favor del cliente..."
   - Campo de monto manual (sin opciones de pago total/parcial)
   - Texto explicativo: "Este monto aumentará el límite de cuenta corriente del cliente"
   - Preview del detalle: "Pago a favor del cliente - $X.XX"
5. Usuario ingresa monto y envía
6. Sistema valida (solo verifica monto > 0) y registra el movimiento
7. Muestra toast de confirmación
8. Recarga tabla de movimientos (mostrará saldo negativo = a favor)
9. Cierra el diálogo

## Próximas Mejoras

- Implementar autenticación para obtener `idUsuarioRegistra` real
- Habilitar otros tipos de movimiento cuando backend esté listo:
  - `nota_debito`
  - `nota_credito`
  - `interes_saldo_global`
  - `pago_factura`
- Agregar campos dinámicos según tipo de movimiento seleccionado
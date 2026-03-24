# Proyecto Venta Stock Frontend - Polish UX (Ventas y Comprobantes)

Hola Claude. Esta es una tarea de **Pulido Estético (Polish)** enfocada 100% en mejorar la experiencia visual del usuario (UX) en el módulo de Ventas de nuestro frontend React (`ProyectoFerreteria`).

Nuestro backend ya soporta Unidades de Medida y cantidades decimales, y eso ya está integrado en el front. Sin embargo, en el día a día operativo de la ferretería, el cajero apenas nota qué unidad está vendiendo y los comprobantes impresos/PDF tampoco lo resaltan.

## Tareas de Pulido Visual a Implementar

### 1. Resaltar Unidades en el "Carrito" (Punto de Venta)
Explora los componentes donde se arma una venta (`VentaForm`, tabla de detalles en memoria, etc).
- **El Input de Cantidad:** Haz que el texto de la Unidad de Medida (Ej: `Kg`, `Lts`, `Mts`) no sea un simple texto gris al lado. Conviértelo en un `Badge` o un `InputGroup` text-suffix de Shadcn UI que tenga contraste (por ejemplo, un background sutil `bg-muted` o `text-primary font-bold`) para que sea **imposible** que el cajero cargue 1.5 metros de cable pensando que cargaba 1.5 unidades.
- **Grilla del Carrito:** En la columna "Cantidad", el número y la unidad deben verse como un bloque sólido, ej: `[ 1.50 ] Kg` con una tipografía un poco más grande o pesada.

### 2. Inyectar la Unidad en el Comprobante (Ticket/Factura)
Explora o pregúntale a Enzo dónde se genera el comprobante o ticket final de la venta (puede ser un componente que renderiza a PDF o una vista de impresión de Ticket).
- Al listar los items vendidos, modifica el string del producto o la columna de cantidad para que diga explícitamente:
  `1.50 Kg - Clavos Punta París ... Subtotal $XXX`
  `2.00 Mts - Cable Sintenax 4mm ... Subtotal $YYY`
- Si la unidad es "1" o "Unidad", puedes omitirla o poner `2 u.` según quede mejor estéticamente.

### 3. (Opcional) Animaciones Sutiles
Cualquier transición suave de Tailwind (`transition-all duration-200`) que puedas agregarle a los inputs de precio y cantidad cuando entran en hover o focus será muy bienvenida para dar esa sensación "premium" de los ERP de última generación.

¡Esto no requiere tocar NADA del backend! Puro CSS, Tailwind y maquetado de React.

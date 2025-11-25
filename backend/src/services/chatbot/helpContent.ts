/* eslint-disable no-useless-escape */
// Centraliza respuestas de ayuda ("cómo crear...") y enlaces directos del frontend.

export const appLinks = {
  // Vehículos
  vehicle: {
    list: "/admin/vehiculos",
    create: "/admin/vehiculos/nuevo",
    edit: (id: string | number) => `/admin/vehiculos/editar/${id}`,
  },
  vehicleBrands: {
    list: "/admin/marcas-vehiculos",
  },
  vehicleModels: {
    list: "/admin/modelos-vehiculos",
  },
  // Cotizaciones
  quotation: {
    list: "/admin/cotizaciones",
    create: "/admin/cotizaciones/nuevo",
    edit: (id: string | number) => `/admin/cotizaciones/editar/${id}`,
  },
  // Órdenes de trabajo
  workOrder: {
    list: "/admin/orden-trabajo",
    create: "/admin/nueva-orden-trabajo",
    edit: (id: string | number) => `/admin/orden-trabajo/editar/${id}`,
  },
  // Clientes / Empresas
  people: {
    list: "/admin/clientes",
  },
  companies: {
    list: "/admin/empresas",
  },
} as const;

// Textos de ayuda breves y accionables con enlaces clicables (Markdown)
export function getHelpFor(topic: "vehicle" | "quotation" | "workOrder"): string {
  switch (topic) {
    case "vehicle":
      return (
        `Cómo crear un vehículo\n\n` +
        `Sigue estos pasos:\n` +
        `1. Abre [Nuevo Vehículo](${appLinks.vehicle.create}) (lista: [Vehículos](${appLinks.vehicle.list})).\n` +
        `2. Completa la **Información del Vehículo**:\n` +
        `   - **Patente** (obligatorio).\n` +
        `   - **Año**.\n` +
        `   - **Color** y **Kilometraje** (si corresponde).\n` +
        `   - **Marca** y luego **Modelo** (el modelo se habilita al elegir marca). Si necesitas gestionar catálogos, ve a [Marcas](${appLinks.vehicleBrands.list}) o [Modelos](${appLinks.vehicleModels.list}).\n` +
        `   - **Estado del Vehículo** (por ejemplo: Funcionando).\n` +
  `3. En **Información del Propietario**:\n` +
  `   - Selecciona **Tipo de Propietario**: *Persona Natural* o *Empresa*.\n` +
  `   - En **Cliente** (obligatorio), elige un registro existente del tipo seleccionado.\n` +
  `   - Si el cliente o empresa no existe, presiona **Crear Cliente** o **Crear Empresa**: se abrirá un **modal** para ingresar datos del cliente o empresa (\n` +
  `     **RUT** opcional, **Nombre***, **Primer Apellido***, **Segundo Apellido** opcional, **Email** opcional, **Teléfono***).\n` +
  `     Guarda el cliente o empresa desde el modal y luego selecciónalo en el campo **Cliente**.\n` +
  `     Alternativamente, puedes gestionarlo desde [Clientes](${appLinks.people.list}) / [Empresas](${appLinks.companies.list}).\n` +
        `4. Revisa los datos y presiona **Guardar** para registrar el vehículo.` +
        `\n\n` +
        `Notas útiles:\n` +
        `- Primero selecciona la **Marca** para habilitar el **Modelo**.\n` +
        `- Puedes editar más tarde desde la lista de [Vehículos](${appLinks.vehicle.list}).`
      );
    case "quotation":
      return (
        `Cómo crear una cotización\n\n` +
        `Sigue estos pasos:\n` +
        `1. Abre [Nueva Cotización](${appLinks.quotation.create}) (lista: [Cotizaciones](${appLinks.quotation.list})).\n` +
        `2. En la sección "Vehículo", elige el tipo de propietario: pestaña **Personas** o **Empresas**.\n` +
        `3. En el selector "Seleccione un vehículo…" verás solo los vehículos del tipo elegido; selecciona el correspondiente.\n` +
        `4. En **Repuestos Seleccionados**, presiona **Añadir Repuesto**. Se abrirá un modal con el inventario (precio y stock). Marca con la "palomita" los repuestos a usar y cierra el modal.\n` +
        `5. Para cada repuesto seleccionado, ajusta la **Cantidad** y la **Mano de obra**. El total por ítem se calcula con ambos valores.\n` +
        `6. Revisa los totales automáticos al final: **Subtotal Productos**, **Total Mano de Obra**, **IVA** y **Total Final** (con IVA).\n` +
        `7. Agrega una **Descripción** de la cotización.\n` +
        `8. Haz clic en **Crear Cotización** para guardar.` +
        `\n\n` +
        `Notas útiles:\n` +
        `- Si el vehículo no existe aún, crea uno en [Nuevo Vehículo](${appLinks.vehicle.create}) y vuelve a esta pantalla.\n` +
        `- Puedes ajustar cantidades o mano de obra cuantas veces necesites; los totales se actualizan automáticamente.`
      );
    case "workOrder":
      return (
  `Cómo crear una orden de trabajo\n\n` +
  `Sigue estos pasos (dos opciones):\n` +
  `1) Desde [Órdenes de Trabajo](${appLinks.workOrder.list}), presiona [Nueva Orden de Trabajo](${appLinks.workOrder.create}).\n` +
  `2) Verás dos pestañas: **Con Cotización** y **Sin Cotización**.\n\n` +
  `Flujo: **Con Cotización**\n` +
  `- Filtra el **Vehículo** (por Todos / Personas / Empresas) y selecciona el vehículo.\n` +
  `- Se mostrarán las **Cotizaciones** asociadas a ese vehículo; elige la que corresponda.\n` +
  `- Ingresa una **Descripción** de la orden.\n` +
  `- Presiona **Crear Orden de Trabajo**.\n\n` +
  `Flujo: **Sin Cotización**\n` +
  `- El formulario es similar a crear una cotización: selecciona vehículo y propietario (Personas/Empresas).\n` +
  `- Agrega productos/servicios y (si corresponde) mano de obra, de forma parecida a [Nueva Cotización](${appLinks.quotation.create}).\n` +
  `- Revisa totales y completa una **Descripción** de la orden.\n` +
  `- Crea la orden.\n\n` +
  `Notas útiles:\n` +
  `- Si no existe el vehículo, créalo en [Nuevo Vehículo](${appLinks.vehicle.create}).\n` +
  `- Si no tienes cotización previa y necesitas una, crea primero una en [Nueva Cotización](${appLinks.quotation.create}).\n` +
  `- Luego puedes editar desde la lista de [Órdenes de Trabajo](${appLinks.workOrder.list}).`
      );
    default:
      return "";
  }
}

// Detección simple de intención de ayuda ("cómo crear...")
export function matchHelpIntent(questionRaw: string): string | null {
  const question = questionRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Palabras clave de intención
  const intentRe = /\b(como|como puedo|como hago|como crear|crear|creo|generar|registrar|hacer)\b/;

  if (!intentRe.test(question)) return null;

  // Tópicos soportados
  const topics: Array<{ key: "workOrder" | "vehicle" | "quotation"; re: RegExp }> = [
    // Orden de trabajo: variantes y typos comunes
    { key: "workOrder", re: /(orde[nm]|orden|ordenes|ordenes)\s*de\s*trabaj[oa]|work\s*order|\bot\b|ot\b|orden\s*trabajo|oren\s*de\s*trabajo/ },
    // Vehículo: sin acentos, plurales y typos básicos
    { key: "vehicle", re: /(vehicul[oa]s?|auto[s]?|carro[s]?|patente|vehicular)/ },
    // Cotización: sin acentos y typos básicos
    { key: "quotation", re: /(cotiza(cion|cion(es)?)|presupuesto[s]?|quote|cotizar|cotisacion|cotisaciones)/ },
  ];

  for (const t of topics) {
    if (t.re.test(question)) {
      return getHelpFor(t.key);
    }
  }

  // Si no detectamos tópico, ofrece atajos principales
  return (
    `¿Qué necesitas crear? Aquí tienes accesos directos:\n\n` +
    `- [Nueva Orden de Trabajo](${appLinks.workOrder.create})\n` +
    `- [Nuevo Vehículo](${appLinks.vehicle.create})\n` +
    `- [Nueva Cotización](${appLinks.quotation.create})\n`
  );
}

export type HelpIntentMatcher = typeof matchHelpIntent;

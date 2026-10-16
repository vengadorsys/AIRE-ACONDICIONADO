/* ==========================================================================
   DATOS DEL NEGOCIO — edita solo este archivo.
   Todo lo que diga "PENDIENTE" debe sustituirse con datos reales del cliente
   antes de venderla o publicarla con su dominio.
   ========================================================================== */
window.__BRAND__ = {
  nombre: "ZUNO Clima",
  ciudad: "Torreón, Coahuila",           // PENDIENTE: ciudad real del negocio
  zona: "Torreón, Gómez Palacio y Lerdo (sujeto a confirmación)",

  // WhatsApp: 10 dígitos del número de México, sin espacios ni guiones.
  // Mientras esté vacío, los botones avisan que la demo falta configurar.
  whatsapp: "4921059504",
  waMensaje: "Hola, vi su página y quiero cotizar un minisplit",

  telefonoVisible: "492 105 9504",
  email: "",                               // p. ej. "contacto@zunoclima.mx"
  horario: "Lunes a sábado · 9:00 a 19:00 (por confirmar)",

  // Pagos
  paypalClientId: "",                      // client-id PÚBLICO de PayPal Business
  spei: {
    banco: "PENDIENTE",
    titular: "PENDIENTE",
    clabe: "000000000000000000"            // PENDIENTE: CLABE real (18 dígitos)
  },

  // Calculadora: supuestos editables (todo es orientativo)
  calc: {
    btuPorM2: 600,          // carga base para clima cálido, techo de 2.6 m
    btuPorPersonaExtra: 500,
    factorSol: { no: 1, parcial: 1.1, directo: 1.2 },
    factorEspacio: { recamara: 1, sala: 1.05, negocio: 1.15, cocina: 1.25 },
    eficienciaConvencional: 11,   // BTU por Wh (equipo de velocidad fija)
    eficienciaInverter: 19,       // BTU por Wh (inverter de buena eficiencia)
    factorCarga: 0.75,            // fracción promedio de la capacidad usada
    premiumInverter: 3500,        // diferencia de precio aprox. inverter vs convencional
    precioKwh: {                  // precio marginal estimado por kWh (con IVA)
      residencial: 3.4,
      DAC: 6.9,
      negocio: 4.2
    },
    limiteDAC: { "1": 250, "1A": 300, "1B": 400, "1C": 850, "1D": 1000, "1E": 2000, "1F": 2500 },
    // Rangos orientativos en MXN — PENDIENTE: validar con el negocio
    equipos: [
      { btu: 12000, ton: "1",   instalacion: [2600, 3400], equipo: [8500, 11500] },
      { btu: 18000, ton: "1.5", instalacion: [3000, 3900], equipo: [10500, 14500] },
      { btu: 24000, ton: "2",   instalacion: [3500, 4500], equipo: [13500, 18000] },
      { btu: 36000, ton: "3",   instalacion: [4500, 6000], equipo: [20000, 27000] }
    ]
  }
};

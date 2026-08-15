export const transportOptions = [
  { value: 'publico', label: 'Transporte publico' },
  { value: 'coche', label: 'Coche propio' },
  { value: 'moto', label: 'Moto' },
  { value: 'bicicleta', label: 'Bicicleta' },
  { value: 'a pie', label: 'A pie' },
]

export const preferenceOptions = [
  { value: 'indiferente', label: 'Indiferente' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
]

export const paceOptions = [
  { value: 'relajado', label: 'Relajado' },
  { value: 'equilibrado', label: 'Equilibrado' },
  { value: 'intenso', label: 'Intenso' },
]

export const siteOptions = [
  {
    id: 'guggenheim-bilbao',
    label: 'Museo Guggenheim Bilbao',
    city: 'Bilbao',
    province: 'Bizkaia',
    setting: 'indoor',
    tags: ['arte', 'arquitectura', 'icono'],
    transport: ['publico', 'coche', 'moto', 'bicicleta'],
    durationHours: 2.5,
    priority: 98,
    description: 'Visita imprescindible para un plan cultural contemporaneo en el corazon de Bilbao.',
  },
  {
    id: 'casco-viejo-bilbao',
    label: 'Casco Viejo de Bilbao',
    city: 'Bilbao',
    province: 'Bizkaia',
    setting: 'outdoor',
    tags: ['gastronomia', 'paseo', 'historia'],
    transport: ['publico', 'coche', 'moto', 'a pie'],
    durationHours: 3,
    priority: 92,
    description: 'Recorrido urbano con gastronomia, comercio local y calles historicas.',
  },
  {
    id: 'gaztelugatxe',
    label: 'San Juan de Gaztelugatxe',
    city: 'Bermeo',
    province: 'Bizkaia',
    setting: 'outdoor',
    tags: ['costa', 'naturaleza', 'mirador'],
    transport: ['coche', 'moto'],
    durationHours: 4,
    priority: 96,
    description: 'Plan de costa con vistas potentes y actividad al aire libre.',
  },
  {
    id: 'la-concha',
    label: 'Playa de La Concha',
    city: 'Donostia',
    province: 'Gipuzkoa',
    setting: 'outdoor',
    tags: ['playa', 'paseo', 'relax'],
    transport: ['publico', 'coche', 'moto', 'bicicleta'],
    durationHours: 2,
    priority: 95,
    description: 'Paseo costero ligero para una jornada relajada en San Sebastian.',
  },
  {
    id: 'peine-del-viento',
    label: 'Peine del Viento',
    city: 'Donostia',
    province: 'Gipuzkoa',
    setting: 'outdoor',
    tags: ['arte', 'costa', 'fotografia'],
    transport: ['publico', 'coche', 'moto', 'bicicleta'],
    durationHours: 1.5,
    priority: 88,
    description: 'Mirador artistico junto al mar, ideal para una parada corta.',
  },
  {
    id: 'kursaal',
    label: 'Kursaal y paseo de Zurriola',
    city: 'Donostia',
    province: 'Gipuzkoa',
    setting: 'indoor',
    tags: ['eventos', 'arquitectura', 'cultura'],
    transport: ['publico', 'coche', 'moto', 'bicicleta'],
    durationHours: 2,
    priority: 84,
    description: 'Bloque cultural urbano con espacio para eventos y paseo moderno.',
  },
  {
    id: 'rioja-alavesa',
    label: 'Rioja Alavesa',
    city: 'Laguardia',
    province: 'Araba',
    setting: 'outdoor',
    tags: ['vino', 'paisaje', 'gastronomia'],
    transport: ['coche', 'moto'],
    durationHours: 5,
    priority: 90,
    description: 'Ruta enoturistica con pueblos historicos y experiencia gastronomica.',
  },
  {
    id: 'valle-salado',
    label: 'Valle Salado de Añana',
    city: 'Añana',
    province: 'Araba',
    setting: 'outdoor',
    tags: ['patrimonio', 'naturaleza', 'historia'],
    transport: ['coche', 'moto'],
    durationHours: 2.5,
    priority: 86,
    description: 'Paisaje historico y didactico con recorrido al aire libre.',
  },
  {
    id: 'museo-bellas-artes',
    label: 'Museo de Bellas Artes de Bilbao',
    city: 'Bilbao',
    province: 'Bizkaia',
    setting: 'indoor',
    tags: ['arte', 'museo', 'lluvia'],
    transport: ['publico', 'coche', 'moto'],
    durationHours: 2,
    priority: 87,
    description: 'Bloque cultural solido para un plan indoor bien resuelto.',
  },
  {
    id: 'hernani-chillida-leku',
    label: 'Chillida Leku',
    city: 'Hernani',
    province: 'Gipuzkoa',
    setting: 'indoor',
    tags: ['arte', 'escultura', 'jardin'],
    transport: ['coche', 'moto', 'publico'],
    durationHours: 2.5,
    priority: 89,
    description: 'Coleccion artistica y entorno verde para una experiencia equilibrada.',
  },
  {
    id: 'urdaibai-biosphere',
    label: 'Reserva de Urdaibai',
    city: 'Gernika',
    province: 'Bizkaia',
    setting: 'outdoor',
    tags: ['naturaleza', 'observacion', 'senderismo'],
    transport: ['coche', 'moto', 'bicicleta'],
    durationHours: 4,
    priority: 94,
    description: 'Plan natural con rutas y miradores para el Pais Vasco mas verde.',
  },
]

export const eventOptions = [
  {
    id: 'festival-jazz-bilbao',
    label: 'Bilbao Jazz Festival',
    city: 'Bilbao',
    province: 'Bizkaia',
    setting: 'indoor',
    tags: ['musica', 'evento', 'noche'],
    transport: ['publico', 'coche'],
    durationHours: 3,
    priority: 91,
    description: 'Evento cultural en sala con facil combinacion urbana.',
  },
  {
    id: 'feria-del-pescado',
    label: 'Feria gastronomica costera',
    city: 'Getaria',
    province: 'Gipuzkoa',
    setting: 'outdoor',
    tags: ['gastronomia', 'mercado', 'costa'],
    transport: ['coche', 'moto'],
    durationHours: 2.5,
    priority: 85,
    description: 'Mercado y degustacion con fuerte componente local.',
  },
  {
    id: 'patrimonio-urbano',
    label: 'Ruta de patrimonio urbano',
    city: 'Vitoria-Gasteiz',
    province: 'Araba',
    setting: 'outdoor',
    tags: ['historia', 'caminar', 'patrimonio'],
    transport: ['publico', 'coche', 'bicicleta'],
    durationHours: 3,
    priority: 88,
    description: 'Recorrido abierto para completar un itinerario cultural y ligero.',
  },
]

export function getSiteById(siteId) {
  return siteOptions.find((site) => site.id === siteId) ?? null
}

export function getSitesByIds(siteIds = []) {
  const normalizedIds = new Set(siteIds.filter(Boolean))

  return siteOptions.filter((site) => normalizedIds.has(site.id))
}

export function getCatalogSeed() {
  return {
    places: siteOptions,
    events: eventOptions,
    transportOptions,
    preferenceOptions,
    paceOptions,
  }
}
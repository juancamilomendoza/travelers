// Suggestions for the city fields. Free text is still allowed: these only speed up typing.

/** Departure cities: Colombian cities first, then major cities around the world. */
const COLOMBIAN_CITIES = [
  "Bogotá",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Bucaramanga",
  "Pereira",
  "Santa Marta",
  "Cúcuta",
  "Manizales",
  "Armenia",
  "Ibagué",
  "Villavicencio",
  "Neiva",
  "Pasto",
  "Montería",
  "Valledupar",
  "Popayán",
  "Tunja",
  "Sincelejo",
  "Riohacha",
  "Quibdó",
  "Florencia",
  "Yopal",
  "Leticia",
  "San Andrés",
  "Rionegro",
  "Palmira",
  "Bello",
  "Soacha",
  "Envigado",
  "Itagüí",
  "Girardot",
  "Barrancabermeja",
  "Apartadó",
  "Tuluá",
  "Buenaventura",
  "Duitama",
  "Sogamoso",
  "Zipaquirá",
  "Chía",
];

const WORLD_CITIES = [
  "Ciudad de México", "Guadalajara", "Monterrey", "Cancún", "Ciudad de Panamá", "San José (Costa Rica)",
  "Ciudad de Guatemala", "San Salvador", "Tegucigalpa", "Managua", "Santo Domingo", "Punta Cana", "San Juan (Puerto Rico)",
  "La Habana", "Caracas", "Maracaibo", "Quito", "Guayaquil", "Lima", "Cusco", "La Paz", "Santa Cruz de la Sierra",
  "Santiago de Chile", "Buenos Aires", "Córdoba (Argentina)", "Mendoza", "Montevideo", "Asunción", "São Paulo",
  "Río de Janeiro", "Brasilia", "Miami", "Orlando", "Nueva York", "Houston", "Dallas", "Atlanta", "Chicago",
  "Los Ángeles", "San Francisco", "Las Vegas", "Washington D. C.", "Boston", "Toronto", "Montreal", "Vancouver",
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga", "Lisboa", "Oporto", "París", "Londres", "Ámsterdam",
  "Bruselas", "Berlín", "Múnich", "Fráncfort", "Zúrich", "Ginebra", "Viena", "Roma", "Milán", "Venecia", "Atenas",
  "Estambul", "Praga", "Budapest", "Varsovia", "Copenhague", "Estocolmo", "Oslo", "Dublín", "Dubái", "Doha",
  "Tel Aviv", "El Cairo", "Marrakech", "Ciudad del Cabo", "Johannesburgo", "Nairobi", "Tokio", "Osaka", "Seúl",
  "Pekín", "Shanghái", "Hong Kong", "Bangkok", "Singapur", "Kuala Lumpur", "Bali", "Manila", "Nueva Delhi", "Bombay",
  "Sídney", "Melbourne", "Auckland",
];

export const ORIGIN_CITIES = [...new Set([...COLOMBIAN_CITIES, ...WORLD_CITIES])];

/** Popular destinations for "Where are you going?", domestic first. */
const DESTINATION_LIST = [
  "San Andrés",
  "Providencia",
  "Cartagena",
  "Santa Marta",
  "Parque Tayrona",
  "Palomino",
  "La Guajira (Cabo de la Vela)",
  "Medellín",
  "Guatapé",
  "Jardín (Antioquia)",
  "Salento",
  "Eje Cafetero",
  "Bogotá",
  "Villa de Leyva",
  "Barichara",
  "San Gil",
  "Cali",
  "Leticia (Amazonas)",
  "Caño Cristales",
  "Capurganá",
  "Nuquí",
  "Bahía Solano",
  "Mompox",
  "Desierto de la Tatacoa",
  "San Agustín",
  "Islas del Rosario",
  "Barú",
  "Punta Cana",
  "Cancún",
  "Ciudad de México",
  "Playa del Carmen",
  "Tulum",
  "Panamá",
  "San Blas",
  "Aruba",
  "Curazao",
  "Lima",
  "Cusco (Machu Picchu)",
  "Quito",
  "Galápagos",
  "Santiago de Chile",
  "Buenos Aires",
  "Río de Janeiro",
  "São Paulo",
  "Costa Rica",
  "Miami",
  "Orlando",
  "Nueva York",
  "Los Ángeles",
  "Las Vegas",
  "Madrid",
  "Barcelona",
  "París",
  "Roma",
  "Londres",
  "Ámsterdam",
  "Lisboa",
  "Estambul",
  "Dubái",
  "Tokio",
  "Ciudad de Panamá",
  "Bocas del Toro",
  "Isla Margarita",
  "Los Roques",
  "Montañita",
  "Máncora",
  "Salar de Uyuni",
  "Bariloche",
  "Patagonia",
  "Cataratas del Iguazú",
  "Florianópolis",
  "Punta del Este",
  "Atacama",
  "Puerto Rico",
  "Jamaica",
  "Bahamas",
  "Hawái",
  "Toronto",
  "Ibiza",
  "Mallorca",
  "Islas Canarias",
  "Santorini",
  "Florencia (Italia)",
  "Costa Amalfitana",
  "Praga",
  "Berlín",
  "Marrakech",
  "Egipto",
  "Bangkok",
  "Bali",
  "Maldivas",
  "Seúl",
  "Sídney",
];

export const DESTINATIONS = [...new Set(DESTINATION_LIST)];

export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Up to `limit` options, those that start with the query first, then those that contain it. */
export function matchPlaces(options: string[], query: string, limit = 8): string[] {
  const q = normalize(query);
  if (!q) return options.slice(0, limit);
  const starts: string[] = [];
  const contains: string[] = [];
  for (const o of options) {
    const n = normalize(o);
    if (n === q) continue;
    if (n.startsWith(q) || n.split(/[\s(]+/).some((w) => w.startsWith(q))) starts.push(o);
    else if (n.includes(q)) contains.push(o);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Nationalities, shown in the page language. Free text is still accepted. */
export const COUNTRIES = {
  es: [
    "Colombia", "México", "España", "Argentina", "Perú", "Chile", "Ecuador", "Venezuela", "Bolivia", "Paraguay",
    "Uruguay", "Brasil", "Panamá", "Costa Rica", "Guatemala", "El Salvador", "Honduras", "Nicaragua", "Cuba",
    "República Dominicana", "Puerto Rico", "Estados Unidos", "Canadá", "Reino Unido", "Francia", "Alemania",
    "Italia", "Portugal", "Países Bajos", "Bélgica", "Suiza", "Austria", "Irlanda", "Suecia", "Noruega",
    "Dinamarca", "Polonia", "Grecia", "Turquía", "Israel", "Emiratos Árabes Unidos", "India", "China", "Japón",
    "Corea del Sur", "Australia", "Nueva Zelanda", "Sudáfrica", "Marruecos", "Egipto", "Filipinas", "Tailandia",
  ],
  en: [
    "Colombia", "Mexico", "Spain", "Argentina", "Peru", "Chile", "Ecuador", "Venezuela", "Bolivia", "Paraguay",
    "Uruguay", "Brazil", "Panama", "Costa Rica", "Guatemala", "El Salvador", "Honduras", "Nicaragua", "Cuba",
    "Dominican Republic", "Puerto Rico", "United States", "Canada", "United Kingdom", "France", "Germany",
    "Italy", "Portugal", "Netherlands", "Belgium", "Switzerland", "Austria", "Ireland", "Sweden", "Norway",
    "Denmark", "Poland", "Greece", "Turkey", "Israel", "United Arab Emirates", "India", "China", "Japan",
    "South Korea", "Australia", "New Zealand", "South Africa", "Morocco", "Egypt", "Philippines", "Thailand",
  ],
};

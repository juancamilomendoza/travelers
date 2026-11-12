// Suggestions for the city fields. Free text is still allowed: these only speed up typing.

/** Colombian cities with commercial flights or main bus terminals, for "Which city are you leaving from?". */
export const ORIGIN_CITIES = [
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

/** Popular destinations for "Where are you going?", domestic first. */
export const DESTINATIONS = [
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
];

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

import type { Lang } from "../shared/schema";

// Draft policy. Replace the [BRACKETED] items and have a lawyer review it before selling any data.
const content = {
  es: {
    title: "Política de Tratamiento de Datos Personales",
    intro:
      "Esta política explica cómo Pa Donde Vamos trata los datos personales que recibe a través de este sitio, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 de Colombia.",
    sections: [
      ["Responsable", "[NOMBRE O RAZÓN SOCIAL], identificado con [NIT/CC], con domicilio en [CIUDAD], Colombia. Contacto: [CORREO DE CONTACTO]."],
      ["Datos que recogemos", "Nombre, correo electrónico, número de WhatsApp, presupuesto, número de viajeros, tipo de plan, fechas, destino, ciudad de salida, y si cuentas con pasaporte, visas, vuelos u hospedaje."],
      [
        "Para qué los usamos",
        "Para generar sugerencias de viaje, enviarte tu plan, y compartirlos con agencias de viaje aliadas que podrán contactarte con ofertas. También para estadísticas internas sobre preferencias de viaje.",
      ],
      ["Con quién los compartimos", "Con agencias de viaje y operadores turísticos aliados, solo si lo autorizaste al marcar la casilla del formulario."],
      [
        "Tus derechos",
        "Puedes conocer, actualizar, rectificar y pedir la eliminación de tus datos, revocar tu autorización y presentar quejas ante la Superintendencia de Industria y Comercio. Para ejercerlos escribe a [CORREO DE CONTACTO]; responderemos en los plazos que fija la ley.",
      ],
      ["Vigencia", "Esta política rige desde el 12 de noviembre de 2026. Conservaremos tus datos mientras sean necesarios para estas finalidades o hasta que pidas su eliminación."],
    ],
    back: "← Volver",
  },
  en: {
    title: "Personal Data Processing Policy",
    intro:
      "This policy explains how Pa Donde Vamos processes the personal data it receives through this site, under Colombian Law 1581 of 2012 and Decree 1377 of 2013.",
    sections: [
      ["Data controller", "[NAME OR COMPANY], ID [NIT/CC], based in [CITY], Colombia. Contact: [CONTACT EMAIL]."],
      ["Data we collect", "Name, email, WhatsApp number, budget, number of travelers, trip type, dates, destination, departure city, and whether you have a passport, visas, flights or lodging."],
      [
        "How we use it",
        "To generate travel suggestions, send you your plan, and share it with partner travel agencies that may contact you with offers. Also for internal statistics on travel preferences.",
      ],
      ["Who we share it with", "Partner travel agencies and tour operators, only if you authorized it by ticking the box on the form."],
      [
        "Your rights",
        "You can access, update, correct and request deletion of your data, revoke your authorization, and file complaints with Colombia's Superintendence of Industry and Commerce. Write to [CONTACT EMAIL]; we will reply within the legal deadlines.",
      ],
      ["Effective date", "This policy is effective from November 12, 2026. We keep your data while needed for these purposes or until you ask us to delete it."],
    ],
    back: "← Back",
  },
};

export default function Privacy({ lang }: { lang: Lang }) {
  const c = content[lang];
  return (
    <article className="card space-y-4">
      <a href="#" className="text-sm font-medium text-brand-700 dark:text-brand-500">
        {c.back}
      </a>
      <h1 className="text-2xl font-bold tracking-tight">{c.title}</h1>
      <p className="text-stone-600 dark:text-stone-400">{c.intro}</p>
      {c.sections.map(([h, body]) => (
        <section key={h}>
          <h2 className="font-semibold">{h}</h2>
          <p className="mt-1 text-stone-600 dark:text-stone-400">{body}</p>
        </section>
      ))}
    </article>
  );
}

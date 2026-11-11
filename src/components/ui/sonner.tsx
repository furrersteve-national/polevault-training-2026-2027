'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** Kurze Rückmeldungen ("Gespeichert", "Abgemeldet") – Sichtbarkeit des Systemstatus */
function Toaster(props: ToasterProps) {
  return <Sonner position="top-center" richColors closeButton duration={3500} {...props} />;
}

export { Toaster };

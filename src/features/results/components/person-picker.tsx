'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Person auswählen – die Auswahl steht in der URL (teilbar, Zurück-Taste funktioniert) */
export function PersonPicker({ names, value }: { names: string[]; value: string }) {
  const router = useRouter();
  const path = usePathname();
  return (
    <Select value={value} onValueChange={(v) => router.push(`${path}?person=${encodeURIComponent(v)}`)}>
      <SelectTrigger aria-label="Person wählen" className="sm:max-w-xs"><SelectValue placeholder="Person wählen" /></SelectTrigger>
      <SelectContent>
        {names.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

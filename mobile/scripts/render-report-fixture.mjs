import { writeFile } from 'node:fs/promises';

import { buildProfessionalPdfHtml } from '../src/services/report-document.ts';

const destination = process.argv[2];
if (!destination) throw new Error('Informe o caminho do HTML de saída.');

const careTypes = [
  ['Sono da noite', 'Berço', '7h 18min', 438, 'Maria · Mãe'],
  ['Acordou', 'Acordou bem', '', '', 'Maria · Mãe'],
  ['Amamentação', 'Esquerdo 8min · Direito 6min', '14min', 14, 'Daniel · Pai'],
  ['Fralda', 'Mista', '', '', 'Daniel · Pai'],
  ['Soneca', 'No colo', '48min', 48, 'Maria · Mãe'],
  ['Mamadeira', 'Leite materno · 90 ml', '12min', 12, 'Ana · Cuidadora'],
];

const events = Array.from({ length: 18 }, (_, index) => {
  const [care, detail, duration, durationMinutes, actor] = careTypes[index % careTypes.length];
  const day = 18 + Math.floor(index / 3);
  const hour = 7 + (index * 2) % 14;
  return {
    date: `${String(day).padStart(2, '0')}/07/2026`,
    startTime: `${String(hour).padStart(2, '0')}:${index % 2 ? '30' : '05'}`,
    endTime: duration ? `${String((hour + 1) % 24).padStart(2, '0')}:${index % 2 ? '18' : '19'}` : '',
    care,
    detail,
    notes: index % 5 === 0 ? 'Registro acompanhado pela família.' : '',
    duration,
    durationMinutes,
    actor,
  };
});

const html = buildProfessionalPdfHtml({
  babyName: 'Francisco',
  periodLabel: '18/07/2026 a 24/07/2026',
  generatedAtLabel: '24/07/2026 07:42',
  days: 7,
  sleep: '18h 42min',
  feedings: 12,
  diapers: 9,
  medicines: 1,
  records: events.length,
  notes: [
    '20/07/2026: Dormiu bem após o banho e acordou tranquilo.',
    '22/07/2026 às 14:30: Pediatra orientou observar apenas a aceitação da mamadeira.',
    '24/07/2026: Rotina da manhã ocorreu sem intercorrências.',
  ],
  events,
});

await writeFile(destination, html, 'utf8');
console.log(destination);

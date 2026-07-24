import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildExcelCsv,
  buildProfessionalPdfHtml,
  buildWhatsappSummary,
} from '../src/services/report-document.ts';

const model = {
  babyName: 'Francisco',
  periodLabel: '18/07/2026 a 24/07/2026',
  generatedAtLabel: '24/07/2026 07:42',
  days: 7,
  sleep: '18h 42min',
  feedings: 12,
  diapers: 9,
  medicines: 1,
  records: 2,
  notes: ['23/07/2026: Dormiu bem após o banho.'],
  events: [
    {
      date: '23/07/2026',
      startTime: '17:52',
      endTime: '17:58',
      care: 'Amamentação',
      detail: 'Esquerdo 4min · Direito 2min',
      notes: 'Mamada tranquila',
      duration: '6min',
      durationMinutes: 6,
      actor: 'Maria · Mãe',
    },
    {
      date: '23/07/2026',
      startTime: '18:01',
      endTime: '',
      care: 'Fralda',
      detail: 'Mista',
      notes: '',
      duration: '',
      durationMinutes: '',
      actor: 'Daniel · Responsável',
    },
  ],
};

const reportsScreen = await readFile(new URL('../src/app/relatorios.tsx', import.meta.url), 'utf8');
const pdf = buildProfessionalPdfHtml(model);
const csv = buildExcelCsv(model);
const whatsapp = buildWhatsappSummary(model, 'Olá! Segue o resumo.');

assert.ok(reportsScreen.includes('Gerar PDF profissional'));
assert.ok(reportsScreen.includes('Compartilhar resumo'));
assert.ok(reportsScreen.includes('Baixar CSV para Excel'));
assert.ok(!reportsScreen.includes('Exportar JSON'));
assert.ok(!reportsScreen.includes("format: 'csv' | 'json'"));

assert.ok(csv.startsWith('\uFEFFsep=;\r\n'));
assert.ok(csv.includes('"Data";"Hora inicial";"Hora final";"Cuidado"'));
assert.ok(csv.includes('"Maria · Mãe"'));
assert.ok(csv.includes('"6"'));

assert.ok(whatsapp.includes('*Ninou | Resumo de Francisco*'));
assert.ok(whatsapp.includes('Sono: *18h 42min*'));
assert.ok(whatsapp.includes('Registros: *2*'));

assert.ok(pdf.includes('linear-gradient(135deg, #2A1B50'));
assert.ok(pdf.includes('Resumo do período'));
assert.ok(pdf.includes('Horários, detalhes e autoria'));
assert.ok(pdf.includes('Maria · Mãe'));
assert.ok(pdf.includes('Observações da família'));
assert.ok(pdf.includes('O Ninou não realiza diagnóstico'));
assert.ok(!/[\u2010-\u2015]/.test(pdf), 'O PDF deve usar somente hífens ASCII.');

console.log('PDF premium, resumo do WhatsApp e CSV para Excel validados.');

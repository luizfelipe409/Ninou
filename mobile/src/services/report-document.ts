export type ReportExportEvent = {
  date: string;
  startTime: string;
  endTime: string;
  care: string;
  detail: string;
  notes: string;
  duration: string;
  durationMinutes: number | '';
  actor: string;
};

export type ReportExportModel = {
  babyName: string;
  periodLabel: string;
  generatedAtLabel: string;
  days: number;
  sleep: string;
  feedings: number;
  diapers: number;
  medicines: number;
  records: number;
  notes: string[];
  events: ReportExportEvent[];
};

function printableText(value: unknown) {
  return String(value ?? '')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function escapeHtml(value: unknown) {
  return printableText(value).replace(
    /[&<>"']/g,
    (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    })[character] || character,
  );
}

function csvCell(value: unknown) {
  return `"${printableText(value).replaceAll('"', '""')}"`;
}

export function buildExcelCsv(model: ReportExportModel) {
  const headers = [
    'Data',
    'Hora inicial',
    'Hora final',
    'Cuidado',
    'Detalhe',
    'Observações',
    'Duração (minutos)',
    'Registrado por',
  ];
  const rows = model.events.map((event) => [
    event.date,
    event.startTime,
    event.endTime,
    event.care,
    event.detail,
    event.notes,
    event.durationMinutes,
    event.actor,
  ]);

  return `\uFEFFsep=;\r\n${[
    headers,
    ...rows,
  ].map((row) => row.map(csvCell).join(';')).join('\r\n')}`;
}

export function buildWhatsappSummary(model: ReportExportModel, introduction: string) {
  const intro = printableText(introduction);
  return [
    intro,
    '',
    `💜 *Ninou | Resumo de ${model.babyName}*`,
    `📅 ${model.periodLabel}`,
    '',
    `😴 Sono: *${model.sleep}*`,
    `🍼 Alimentações: *${model.feedings}*`,
    `🧷 Fraldas: *${model.diapers}*`,
    `💊 Medicamentos: *${model.medicines}*`,
    `📝 Registros: *${model.records}*`,
    '',
    'Resumo informativo preparado no Ninou.',
  ].filter((line, index, lines) => line || (index > 0 && lines[index - 1])).join('\n');
}

export function buildProfessionalPdfHtml(model: ReportExportModel) {
  const rows = model.events.map((event, index) => `
    <tr>
      <td class="date-cell">${escapeHtml(event.date)}<span>${escapeHtml(event.startTime)}${event.endTime ? ` - ${escapeHtml(event.endTime)}` : ''}</span></td>
      <td><span class="care-pill care-${index % 4}">${escapeHtml(event.care)}</span></td>
      <td class="detail-cell">${escapeHtml(event.detail || 'Sem detalhe')}${event.notes ? `<span class="secondary">${escapeHtml(event.notes)}</span>` : ''}</td>
      <td>${escapeHtml(event.duration || '-')}</td>
      <td class="actor-cell">${escapeHtml(event.actor)}</td>
    </tr>
  `).join('');

  const notes = model.notes.map((note, index) => `
    <div class="note-item">
      <span class="note-index">${String(index + 1).padStart(2, '0')}</span>
      <p>${escapeHtml(note)}</p>
    </div>
  `).join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @page { size: A4; margin: 13mm 13mm 17mm; }
    * { box-sizing: border-box; }
    html {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      margin: 0;
      color: #2F2843;
      background: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      font-size: 10.5px;
      line-height: 1.45;
    }
    .report-header {
      position: relative;
      min-height: 176px;
      overflow: hidden;
      padding: 23px 26px;
      border-radius: 24px;
      color: #FFFFFF;
      background: linear-gradient(135deg, #2A1B50 0%, #6548D4 54%, #7B5CED 100%);
      box-shadow: 0 14px 34px rgba(55, 37, 104, 0.18);
    }
    .report-header::before,
    .report-header::after {
      position: absolute;
      content: "";
      border-radius: 999px;
      pointer-events: none;
    }
    .report-header::before {
      width: 210px;
      height: 210px;
      right: -62px;
      top: -104px;
      border: 34px solid rgba(255, 255, 255, 0.09);
    }
    .report-header::after {
      width: 128px;
      height: 128px;
      right: 46px;
      bottom: -92px;
      background: rgba(97, 225, 191, 0.24);
    }
    .brand-row {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-mark {
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 13px;
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.14);
      font-size: 18px;
      font-weight: 900;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
    }
    .brand-name {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 2.8px;
    }
    .brand-caption {
      display: block;
      margin-top: 1px;
      color: rgba(255, 255, 255, 0.72);
      font-size: 7px;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }
    .document-label {
      padding: 6px 10px;
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 999px;
      color: rgba(255, 255, 255, 0.9);
      background: rgba(23, 16, 46, 0.18);
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }
    .hero-copy {
      position: relative;
      z-index: 1;
      margin-top: 25px;
    }
    .eyebrow {
      color: #BDF4E5;
      font-size: 8px;
      font-weight: 900;
      letter-spacing: 1.8px;
      text-transform: uppercase;
    }
    h1 {
      margin: 5px 0 0;
      max-width: 470px;
      color: #FFFFFF;
      font-size: 31px;
      line-height: 1.06;
      letter-spacing: -0.8px;
    }
    .period {
      margin-top: 8px;
      color: rgba(255, 255, 255, 0.78);
      font-size: 10px;
      font-weight: 650;
    }
    .summary-section {
      margin-top: 20px;
    }
    .section-heading {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin: 0 2px 10px;
    }
    .section-heading h2 {
      margin: 0;
      color: #2F2843;
      font-size: 17px;
      line-height: 1.2;
      letter-spacing: -0.3px;
    }
    .section-heading p {
      margin: 0;
      color: #81758F;
      font-size: 8px;
      font-weight: 700;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .kpi {
      position: relative;
      min-height: 78px;
      overflow: hidden;
      padding: 13px 13px 11px;
      border: 1px solid #EAE1F0;
      border-radius: 17px;
      background: #FCF9FD;
    }
    .kpi::after {
      position: absolute;
      width: 45px;
      height: 45px;
      right: -20px;
      bottom: -22px;
      border-radius: 999px;
      content: "";
      background: var(--accent-soft);
    }
    .kpi:nth-child(1) { --accent: #7558E8; --accent-soft: #E8DFFF; }
    .kpi:nth-child(2) { --accent: #35A98C; --accent-soft: #DDF5ED; }
    .kpi:nth-child(3) { --accent: #D68657; --accent-soft: #FCE8DB; }
    .kpi:nth-child(4) { --accent: #BC5D7B; --accent-soft: #F7E0E8; }
    .kpi-label {
      color: #786C87;
      font-size: 7.5px;
      font-weight: 850;
      letter-spacing: 0.9px;
      text-transform: uppercase;
    }
    .kpi-value {
      display: block;
      margin-top: 7px;
      color: var(--accent);
      font-size: 20px;
      line-height: 1;
      font-weight: 900;
      letter-spacing: -0.4px;
    }
    .overview {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
      padding: 11px 14px;
      border: 1px solid #E9E0EF;
      border-radius: 16px;
      background: linear-gradient(90deg, #F5F0FF 0%, #F7FBFA 100%);
    }
    .overview-item {
      padding-right: 8px;
      border-right: 1px solid #E4DCEB;
    }
    .overview-item:last-child {
      border-right: 0;
    }
    .overview-label {
      color: #81758F;
      font-size: 7px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .overview-value {
      display: block;
      margin-top: 3px;
      color: #392C50;
      font-size: 12px;
      font-weight: 900;
    }
    .timeline-section {
      margin-top: 20px;
      break-before: auto;
    }
    .table-shell {
      overflow: hidden;
      border: 1px solid #E6DDEA;
      border-radius: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    thead {
      display: table-header-group;
    }
    th {
      padding: 10px 9px;
      color: #6C5C82;
      background: #F3EDF8;
      font-size: 7px;
      font-weight: 900;
      letter-spacing: 0.75px;
      text-align: left;
      text-transform: uppercase;
    }
    td {
      padding: 10px 9px;
      border-top: 1px solid #EEE7F1;
      color: #443754;
      font-size: 8.3px;
      vertical-align: top;
      word-break: break-word;
    }
    tbody tr {
      break-inside: avoid;
    }
    tbody tr:nth-child(even) {
      background: #FDFBFD;
    }
    .date-cell {
      width: 16%;
      font-weight: 850;
    }
    .date-cell span,
    .secondary {
      display: block;
      margin-top: 3px;
      color: #8D8299;
      font-size: 7.2px;
      font-weight: 600;
    }
    .detail-cell { width: 29%; }
    .actor-cell { color: #665777; font-size: 7.6px; }
    .care-pill {
      display: inline-block;
      max-width: 100%;
      padding: 4px 7px;
      border-radius: 999px;
      color: #5B42BA;
      background: #EDE5FF;
      font-size: 7.4px;
      font-weight: 850;
    }
    .care-1 { color: #237D68; background: #DFF5EE; }
    .care-2 { color: #A45E36; background: #FBE8DC; }
    .care-3 { color: #A14868; background: #F7E2EA; }
    .empty-state {
      padding: 26px;
      color: #81758F;
      text-align: center;
    }
    .empty-state strong {
      display: block;
      margin-bottom: 4px;
      color: #433453;
      font-size: 12px;
    }
    .notes-section {
      margin-top: 18px;
      break-inside: avoid;
    }
    .notes-card {
      padding: 5px 14px;
      border: 1px solid #CFEADF;
      border-radius: 18px;
      background: #F2FBF8;
    }
    .note-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid #DDEFE9;
    }
    .note-item:last-child { border-bottom: 0; }
    .note-index {
      flex: 0 0 auto;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9px;
      color: #237D68;
      background: #D9F2EA;
      font-size: 7px;
      font-weight: 900;
    }
    .note-item p {
      margin: 3px 0 0;
      color: #42675D;
      white-space: pre-wrap;
    }
    .legal-card {
      display: flex;
      align-items: center;
      gap: 11px;
      margin-top: 18px;
      padding: 12px 14px;
      border-radius: 15px;
      color: #766A82;
      background: #F7F3F8;
      font-size: 7.7px;
      break-inside: avoid;
    }
    .legal-mark {
      flex: 0 0 auto;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      color: #7558E8;
      background: #EAE2FF;
      font-size: 12px;
      font-weight: 900;
    }
    .page-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 18px;
      padding-top: 8px;
      border-top: 1px solid #E7DFEA;
      color: #9B90A5;
      font-size: 6.7px;
      font-weight: 700;
      letter-spacing: 0.35px;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <header class="report-header">
    <div class="brand-row">
      <div class="brand">
        <div class="brand-mark">N</div>
        <div>
          <div class="brand-name">NINOU</div>
          <span class="brand-caption">Diário compartilhado do bebê</span>
        </div>
      </div>
      <div class="document-label">Relatório de rotina</div>
    </div>
    <div class="hero-copy">
      <div class="eyebrow">Cuidado organizado com carinho</div>
      <h1>Rotina de ${escapeHtml(model.babyName)}</h1>
      <div class="period">${escapeHtml(model.periodLabel)} | Preparado para a família</div>
    </div>
  </header>

  <section class="summary-section">
    <div class="section-heading">
      <h2>Resumo do período</h2>
      <p>Leitura rápida dos cuidados registrados</p>
    </div>
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi-label">Sono total</span><strong class="kpi-value">${escapeHtml(model.sleep)}</strong></div>
      <div class="kpi"><span class="kpi-label">Alimentações</span><strong class="kpi-value">${model.feedings}</strong></div>
      <div class="kpi"><span class="kpi-label">Fraldas</span><strong class="kpi-value">${model.diapers}</strong></div>
      <div class="kpi"><span class="kpi-label">Medicamentos</span><strong class="kpi-value">${model.medicines}</strong></div>
    </div>
    <div class="overview">
      <div class="overview-item"><span class="overview-label">Período analisado</span><strong class="overview-value">${model.days} dia${model.days === 1 ? '' : 's'}</strong></div>
      <div class="overview-item"><span class="overview-label">Registros</span><strong class="overview-value">${model.records}</strong></div>
      <div class="overview-item"><span class="overview-label">Observações</span><strong class="overview-value">${model.notes.length}</strong></div>
    </div>
  </section>

  <section class="timeline-section">
    <div class="section-heading">
      <h2>Linha do tempo</h2>
      <p>Horários, detalhes e autoria</p>
    </div>
    ${rows ? `
      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th style="width:16%">Data e hora</th>
              <th style="width:18%">Cuidado</th>
              <th style="width:29%">Detalhes</th>
              <th style="width:13%">Duração</th>
              <th style="width:24%">Registrado por</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    ` : `
      <div class="table-shell empty-state">
        <strong>Nenhum registro neste período</strong>
        Assim que a família registrar um cuidado, ele aparecerá nesta linha do tempo.
      </div>
    `}
  </section>

  ${notes ? `
    <section class="notes-section">
      <div class="section-heading">
        <h2>Observações da família</h2>
        <p>Contexto adicional do período</p>
      </div>
      <div class="notes-card">${notes}</div>
    </section>
  ` : ''}

  <div class="legal-card">
    <div class="legal-mark">i</div>
    <div>Este documento organiza informações registradas pela família. O Ninou não realiza diagnóstico, não prescreve tratamentos e não substitui avaliação pediátrica ou atendimento profissional.</div>
  </div>

  <footer class="page-footer">
    <span>NINOU | ROTINA EM FAMÍLIA</span>
    <span>Gerado em ${escapeHtml(model.generatedAtLabel)}</span>
  </footer>
</body>
</html>`;
}

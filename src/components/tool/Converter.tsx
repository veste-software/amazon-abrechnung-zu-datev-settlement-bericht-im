import { useEffect, useRef, useState } from 'preact/hooks';
import { convertSettlement, type Conversion } from '../../lib/convert';
import type { ExtfFile } from '../../lib/datev/extf';
import { BU_NOTE, downloadState, isAcknowledged, setAcknowledged } from '../../lib/gate';
import { checkLicence } from '../../lib/licence-client';
import { formatCents, formatDateDe } from '../../lib/money';
import { demoProfile } from '../../lib/profile/defaults';
import type { Kontenprofil, Mandant, ProfileSettings } from '../../lib/profile/schema';
import { applySuggestion } from '../../lib/profile/suggest';
import { exportProfile,importProfile, loadProfile, saveProfile } from '../../lib/profile/storage';
import { decodeSettlement } from '../../lib/settlement/decode';
import { parseSettlement } from '../../lib/settlement/parse';
import type { Settlement } from '../../lib/settlement/types';
import { track } from '../../lib/track';
import { withBase } from '../../lib/url';
import { zipFiles } from '../../lib/zip';
import Stamp from '../Stamp';

const LICENCE_STORAGE = 'a2d:licence';

function saveBlob(name: string, bytes: Uint8Array, type: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const PLANS = [
  { id: 'haendler-month', name: 'Händler', price: '9 € / Monat', note: '1 Mandantennummer' },
  { id: 'haendler-year', name: 'Händler', price: '89 € / Jahr', note: '1 Mandantennummer' },
  { id: 'kanzlei-month', name: 'Kanzlei', price: '29 € / Monat', note: 'bis 25 Mandantennummern' },
  { id: 'kanzlei-year', name: 'Kanzlei', price: '290 € / Jahr', note: 'bis 25 Mandantennummern' },
];

type Loaded =
  | { name: string; ok: false; error: string }
  | { name: string; ok: true; settlement: Settlement };

function stampTime(): string {
  const d = new Date();
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${p(d.getMilliseconds(), 3)}`;
}

interface FieldProps {
  label: string;
  value: string;
  onInput: (v: string) => void;
  hint?: string;
  inputMode?: 'numeric' | 'text';
}

function Field({ label, value, onInput, hint, inputMode = 'numeric' }: FieldProps) {
  return (
    <label class="field">
      <span class="label">{label}</span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onInput={(e) => onInput((e.currentTarget as HTMLInputElement).value.trim())}
        autocomplete="off"
      />
      {hint && <small class="hint">{hint}</small>}
    </label>
  );
}

export default function Converter() {
  const [files, setFiles] = useState<Loaded[]>([]);
  const [profile, setProfile] = useState<Kontenprofil>(demoProfile);
  const [mandant, setMandant] = useState<Mandant>({ beraternummer: '', mandantennummer: '' });
  const [override, setOverride] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [licenceKey, setLicenceKey] = useState('');
  const [message, setMessage] = useState('');
  const [importError, setImportError] = useState('');
  const [previewOnly, setPreviewOnly] = useState(false);
  const [ackTick, setAckTick] = useState(0);
  const [busy, setBusy] = useState('');
  const dzState = drag ? 'over' : busy ? 'working' : files.length === 0 ? 'empty' : files.some((f) => !f.ok) ? 'error' : 'done';

  useEffect(() => {
    const stored = loadProfile(localStorage);
    if (stored) setProfile(stored);
    setLicenceKey(localStorage.getItem(LICENCE_STORAGE) ?? '');
  }, []);
  useEffect(() => saveProfile(localStorage, profile), [profile]);

  async function download(files: ExtfFile[]) {
    setMessage('');
    if (!licenceKey) {
      track('plans_opened');
      dialog.current?.showModal();
      return;
    }
    const answer = await checkLicence(licenceKey, mandant);
    if (answer === 'unavailable') {
      setPreviewOnly(true);
      setMessage('Die Lizenzprüfung ist hier nicht erreichbar (Vorschau ohne Server).');
      dialog.current?.showModal();
      return;
    }
    if (answer === 'refused') {
      setMessage('Der Lizenzschlüssel gilt nicht für diese Beraternummer/Mandantennummer oder ist abgelaufen.');
      dialog.current?.showModal();
      return;
    }
    if (files.length === 1) saveBlob(files[0].fileName, files[0].bytes, 'text/csv');
    else saveBlob('EXTF_Amazon.zip', zipFiles(files), 'application/zip');
    track('download');
  }

  async function importFile(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    const r = importProfile(await f.text());
    if (r.ok) {
      setProfile(r.profile);
      setImportError('');
    } else setImportError(r.error);
  }

  const setSetting = <K extends keyof ProfileSettings>(k: K, v: ProfileSettings[K]) =>
    setProfile((p) => ({ ...p, settings: { ...p.settings, [k]: v } }));

  async function load(list: FileList | null) {
    if (!list || !list.length) return;
    const out: Loaded[] = [];
    setBusy(Array.from(list).map((f) => f.name).join(', '));
    for (const f of Array.from(list)) {
      const text = decodeSettlement(new Uint8Array(await f.arrayBuffer()));
      const r = parseSettlement(text);
      out.push(r.ok ? { name: f.name, ok: true, settlement: r.settlement } : { name: f.name, ok: false, error: r.error });
    }
    setFiles(out);
    setBusy('');
    setOverride(false);
    track('file_parsed');
  }

  function mapPair(key: string, account: string) {
    setProfile((p) => {
      const rest = p.mapping.filter((m) => m.key !== key);
      return { ...p, mapping: [...rest, { key, account, bu: '', prefix: '', sammel: false, zusammenfassen: true }] };
    });
  }

  const s = profile.settings;
  return (
    <div class="tool">
      <p class="section-label">01 Datei</p>
      <div
        class={`dropzone${drag ? ' is-over' : ''}`}
        data-state={dzState}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void load(e.dataTransfer?.files ?? null);
        }}
      >
        {dzState === 'empty' || dzState === 'over' || dzState === 'working' || dzState === 'error' ? (
          <img class="dropzone-art" src={withBase('/art/spot-empty.svg')} alt="" width="480" height="360" />
        ) : null}
        <div>
          {dzState === 'error' && <p class="label">Fehler</p>}
          <p class="dropzone-title">
            {dzState === 'over'
              ? 'Loslassen, um zu prüfen'
              : dzState === 'working'
                ? 'Datei wird gelesen'
                : dzState === 'done'
                  ? 'Abrechnung gelesen'
                  : 'Abrechnungsbericht hier ablegen'}
          </p>
          <p class="dropzone-meta">
            {dzState === 'working' || dzState === 'done'
              ? busy || files.map((f) => f.name).join(', ')
              : dzState === 'error'
                ? 'Die Datei konnte nicht gelesen werden. Die Meldung steht unten.'
                : 'Beispiel: 12345678901.txt (Flat File V2, EUR) · mehrere Dateien möglich'}
          </p>
        </div>
        <button type="button" class={dzState === 'done' ? 'btn' : 'btn btn-primary'} disabled={dzState === 'working'} onClick={() => input.current?.click()}>
          {dzState === 'done' ? 'Andere Datei wählen' : 'Abrechnung auswählen'}
        </button>
        <input
          ref={input}
          class="visually-hidden"
          type="file"
          accept=".txt,.tsv,.csv,text/plain,text/tab-separated-values"
          multiple
          tabIndex={-1}
          aria-label="Abrechnungsdatei auswählen"
          onChange={(e) => void load((e.currentTarget as HTMLInputElement).files)}
        />
      </div>
      <div class="tool-foot">
        <p>Die Datei bleibt in Ihrem Browser. Es wird nichts hochgeladen.</p>
        <p class="num">
          <a href={withBase('/preise/')}>Prüfung und Vorschau kostenlos · Export ab 9 € im Monat</a>
        </p>
      </div>

      <details class="settings">
        <summary>Einstellungen und Konten</summary>
        <p class="notice notice-warn">
          <span class="label">Achtung</span>Die vorbelegten Kontonummern sind Platzhalter zum Ausprobieren, keine Buchungsempfehlung. Stimmen Sie die
          Konten mit Ihrer Steuerkanzlei ab.
        </p>
        <div class="settings-grid">
          <Field label="Beraternummer (4–7 Ziffern)" value={mandant.beraternummer} onInput={(v) => setMandant({ ...mandant, beraternummer: v })} />
          <Field label="Mandantennummer (1–5 Ziffern)" value={mandant.mandantennummer} onInput={(v) => setMandant({ ...mandant, mandantennummer: v })} />
          <label class="field">
            <span class="label">Kontenrahmen (nur für Vorschläge)</span>
            <select value={profile.chart} onChange={(e) => setProfile({ ...profile, chart: (e.currentTarget as HTMLSelectElement).value as Kontenprofil['chart'] })}>
              <option value="SKR03">SKR03</option>
              <option value="SKR04">SKR04</option>
            </select>
          </label>
          <label class="field">
            <span class="label">Beginn Wirtschaftsjahr (Monat)</span>
            <select value={String(s.wjStartMonth)} onChange={(e) => setSetting('wjStartMonth', Number((e.currentTarget as HTMLSelectElement).value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option value={String(i + 1)}>{`01.${String(i + 1).padStart(2, '0')}.`}</option>
              ))}
            </select>
          </label>
          <Field label="Sachkontenlänge" value={String(s.sachkontenlaenge)} onInput={(v) => setSetting('sachkontenlaenge', Number(v) || 0)} />
          <Field label="Amazon-Verrechnungskonto" value={s.verrechnungskonto} onInput={(v) => setSetting('verrechnungskonto', v)} />
          <Field label="Geldtransit (Auszahlung)" value={s.geldtransit} onInput={(v) => setSetting('geldtransit', v)} />
          <Field label="Sammeldebitor (Umsätze)" value={s.sammeldebitor} onInput={(v) => setSetting('sammeldebitor', v)} />
          <Field label="Differenzkonto" value={s.differenzkonto} onInput={(v) => setSetting('differenzkonto', v)} />
        </div>
        <h3>Kontenzuordnung</h3>
        <div class="scroll">
          <table class="ledger mapping">
            <thead>
              <tr>
                <th>amount-type | amount-description</th>
                <th>Sammeldebitor</th>
                <th>Konto</th>
                <th>BU</th>
                <th>Text-Präfix</th>
                <th>je Bestellung</th>
              </tr>
            </thead>
            <tbody>
              {profile.mapping.map((m, i) => {
                const set = (patch: Partial<typeof m>) =>
                  setProfile((p) => ({ ...p, mapping: p.mapping.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
                return (
                  <tr key={m.key}>
                    <td class="num-left">{m.key}</td>
                    <td>
                      <input type="checkbox" aria-label={`${m.key}: auf Sammeldebitor buchen`} checked={m.sammel} onChange={(e) => set({ sammel: (e.currentTarget as HTMLInputElement).checked })} />
                    </td>
                    <td>
                      <input class="cell-input" inputMode="numeric" aria-label={`${m.key}: Konto`} value={m.account} disabled={m.sammel} onInput={(e) => set({ account: (e.currentTarget as HTMLInputElement).value.trim() })} />
                    </td>
                    <td>
                      <input class="cell-input narrow" inputMode="numeric" aria-label={`${m.key}: BU-Schlüssel`} value={m.bu} onInput={(e) => set({ bu: (e.currentTarget as HTMLInputElement).value.trim() })} />
                    </td>
                    <td>
                      <input class="cell-input wide" aria-label={`${m.key}: Buchungstext-Präfix`} value={m.prefix} onInput={(e) => set({ prefix: (e.currentTarget as HTMLInputElement).value })} />
                    </td>
                    <td>
                      <input type="checkbox" aria-label={`${m.key}: zusammenfassen pro Bestellung`} checked={m.zusammenfassen} onChange={(e) => set({ zusammenfassen: (e.currentTarget as HTMLInputElement).checked })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p class="actions">
          <button type="button" class="btn" onClick={() => setProfile((p) => applySuggestion(p))}>
            Vorschlag laden
          </button>
          <button type="button" class="btn" onClick={() => saveBlob('Kontenprofil.json', new TextEncoder().encode(exportProfile(profile)), 'application/json')}>
            Kontenprofil exportieren
          </button>{' '}
          <button type="button" class="btn" onClick={() => importInput.current?.click()}>
            Kontenprofil importieren
          </button>
          <input
            ref={importInput}
            class="visually-hidden"
            type="file"
            accept="application/json,.json"
            tabIndex={-1}
            aria-label="Kontenprofil auswählen"
            onChange={(e) => void importFile((e.currentTarget as HTMLInputElement).files)}
          />
        </p>
        {importError && (
          <p class="notice notice-warn">
            <span class="label">Fehler</span>
            {importError} Das gespeicherte Kontenprofil bleibt unverändert.
          </p>
        )}
        <label class="field">
          <span class="label">Lizenzschlüssel</span>
          <input
            type="text"
            value={licenceKey}
            autocomplete="off"
            onInput={(e) => {
              const v = (e.currentTarget as HTMLInputElement).value.trim();
              setLicenceKey(v);
              localStorage.setItem(LICENCE_STORAGE, v);
            }}
          />
          <small class="hint">Wird nur in diesem Browser gespeichert. Zur Prüfung gehen Schlüssel und ein Hash der Nummern an den Server, nie die Datei.</small>
        </label>
      </details>

      <div aria-live="polite" class="results">
        {files.map((f) => (f.ok ? <Result key={f.name} name={f.name} settlement={f.settlement} profile={profile} mandant={mandant} override={override} setOverride={setOverride} mapPair={mapPair} acknowledged={isAcknowledged(localStorage, profile) && ackTick >= 0} onAck={(v) => { setAcknowledged(localStorage, profile, v); setAckTick((n) => n + 1); }} hasKey={licenceKey !== ''} onDownload={download} /> : (
          <section class="printout">
            <p class="section-label">02 Prüfung</p>
            <p class="notice notice-warn">
              <span class="label">Achtung</span>
              {f.name}: {f.error}
            </p>
          </section>
        )))}
      </div>
      {message && (
        <p class="notice notice-warn" role="status">
          <span class="label">Hinweis</span>
          {message}
        </p>
      )}

      <dialog ref={dialog} class="plans" aria-labelledby="plans-title">
        <h2 id="plans-title">Für den Download brauchen Sie eine Lizenz</h2>
        <p>Die Prüfung und die Vorschau bleiben kostenlos. Preise netto zuzüglich Umsatzsteuer, Abbuchung per Kreditkarte über Stripe.</p>
        {previewOnly ? (
          <p class="notice notice-warn">
            <span class="label">Hinweis</span>In dieser Vorschau ist der Kauf nicht möglich.
          </p>
        ) : null}
        <form method="post" action={withBase('/api/checkout')}>
          <table class="ledger">
            <thead>
              <tr>
                <th>Tarif</th>
                <th class="num">Preis</th>
                <th>Umfang</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {PLANS.map((p) => (
                <tr>
                  <td>{p.name}</td>
                  <td class="num">{p.price}</td>
                  <td>{p.note}</td>
                  <td>
                    <button class="btn btn-primary" type="submit" name="plan" value={p.id} disabled={previewOnly}>
                      Wählen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </form>
        <form method="dialog">
          <button class="btn" type="submit">
            Schließen
          </button>
        </form>
      </dialog>
    </div>
  );
}

interface ResultProps {
  name: string;
  settlement: Settlement;
  profile: Kontenprofil;
  mandant: Mandant;
  override: boolean;
  setOverride: (v: boolean) => void;
  mapPair: (key: string, account: string) => void;
  acknowledged: boolean;
  onAck: (v: boolean) => void;
  hasKey: boolean;
  onDownload: (files: ExtfFile[]) => void;
}

function Result({ name, settlement, profile, mandant, override, setOverride, mapPair, acknowledged, onAck, hasKey, onDownload }: ResultProps) {
  const conv: Conversion = convertSettlement(settlement, profile, mandant, { overrideDifference: override, erzeugtAm: stampTime() });
  const c = conv.check;
  const preview = (conv.files[0]?.dataLines ?? []).slice(0, 25);
  const diffAbs = Math.abs(c.differenceCents);
  const state = downloadState({ blockers: conv.blockers, acknowledged, hasLicenceKey: hasKey });
  const disabled = state.action === 'disabled';
  return (
    <section class="printout" aria-label={`Prüfung ${name}`}>
      <p class="section-label">02 Prüfung</p>
      <p class="printhead num">
        Abrechnung {settlement.settlementId} · {formatDateDe(settlement.startDate)}–{formatDateDe(settlement.endDate)} · Auszahlung{' '}
        {formatDateDe(settlement.depositDate)}
      </p>
      <div class="verdict">
        <div>
          <p class="label">Differenz zur Auszahlung</p>
          <p class="figure num" data-state={c.balanced ? 'ok' : 'diff'}>
            {formatCents(diffAbs)} €
          </p>
        </div>
        <div class="stamp-wrap">
          {!c.balanced && <img class="verdict-art" src={withBase('/art/spot-difference.svg')} alt="" width="480" height="360" />}
          <Stamp state={c.balanced ? 'ok' : 'diff'} amount={`${formatCents(diffAbs)} €`} id={`stamp-${settlement.settlementId}`} />
        </div>
      </div>
      <table class="ledger soll-ist">
        <tbody>
          <tr>
            <th scope="row">Amazon-Auszahlung (total-amount)</th>
            <td class="num">{formatCents(c.totalCents)} €</td>
          </tr>
          <tr>
            <th scope="row">Summe aller Zeilen</th>
            <td class="num">{formatCents(c.sumCents)} €</td>
          </tr>
          <tr>
            <th scope="row">Buchungen / Dateien</th>
            <td class="num">
              {conv.bookings.length} / {conv.files.length}
            </td>
          </tr>
        </tbody>
      </table>
      {settlement.notices.map((n) => (
        <p class="notice">
          <span class="label">Hinweis</span>
          {n}
        </p>
      ))}
      {c.duplicateCount > 0 && (
        <p class="notice notice-warn">
          <span class="label">Achtung</span>
          {c.duplicateCount} Zeile(n) sind in allen Spalten identisch mit einer früheren Zeile. Sie werden nicht entfernt, sondern mitgebucht.
        </p>
      )}

      {c.unmapped.length > 0 && (
        <>
          <h3>Nicht zugeordnet</h3>
          <table class="ledger">
            <thead>
              <tr>
                <th>amount-type | amount-description</th>
                <th class="num">Anzahl</th>
                <th class="num">Summe</th>
                <th>Konto</th>
              </tr>
            </thead>
            <tbody>
              {c.unmapped.map((u) => (
                <tr>
                  <td class="num-left">{u.key}</td>
                  <td class="num">{u.count}</td>
                  <td class="num">{formatCents(u.sumCents)}</td>
                  <td>
                    <label>
                      <span class="visually-hidden">Konto für {u.key}</span>
                      <input
                        class="cell-input"
                        inputMode="numeric"
                        placeholder="Konto"
                        onChange={(e) => mapPair(u.key, (e.currentTarget as HTMLInputElement).value.trim())}
                      />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h3>Summen je Konto</h3>
      <table class="ledger">
        <thead>
          <tr>
            <th>Gegenkonto</th>
            <th class="num">Summe</th>
          </tr>
        </thead>
        <tbody>
          {c.perAccount.map((a) => (
            <tr>
              <td class="num-left">{a.account}</td>
              <td class="num">{formatCents(a.sumCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Die 20 größten Buchungen</h3>
      <div class="scroll">
        <table class="ledger">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Beleg</th>
              <th>Text</th>
              <th>Gegenkonto</th>
              <th class="num">Betrag</th>
            </tr>
          </thead>
          <tbody>
            {c.largest.map((b) => (
              <tr>
                <td class="num-left">{formatDateDe(b.belegdatum)}</td>
                <td class="num-left">{b.belegfeld1}</td>
                <td>{b.text}</td>
                <td class="num-left">{b.gegenkonto}</td>
                <td class="num">
                  {formatCents(b.signedCents)} {b.sh}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p class="section-label">03 Export</p>
      <h3>Vorschau: erste {preview.length} Buchungszeilen</h3>
      <div class="scroll">
        <pre class="preview num" tabIndex={0} aria-label="Vorschau der Buchungszeilen">{preview.join('\n') || 'Keine Buchungen.'}</pre>
      </div>

      {!c.balanced && (
        <label class="check">
          <input type="checkbox" checked={override} onChange={(e) => setOverride((e.currentTarget as HTMLInputElement).checked)} />
          <span>
            Trotzdem exportieren (Differenz wird als Buchung auf Konto {profile.settings.differenzkonto || '____'} ausgewiesen)
          </span>
        </label>
      )}
      <label class="check">
        <input type="checkbox" checked={acknowledged} onChange={(e) => onAck((e.currentTarget as HTMLInputElement).checked)} />
        <span>Kontenzuordnung mit meiner Steuerkanzlei abgestimmt</span>
      </label>
      <p class="hint">{BU_NOTE}</p>
      <p>
        <button
          type="button"
          class="btn btn-primary"
          aria-disabled={disabled ? 'true' : undefined}
          aria-describedby="why-disabled"
          onClick={() => {
            if (!disabled) onDownload(conv.files);
          }}
        >
          {conv.files.length > 1 ? `${conv.files.length} Dateien als ZIP herunterladen` : 'EXTF-Datei herunterladen'}
        </button>
      </p>
      <p id="why-disabled" class="hint">
        {state.reason}
      </p>
    </section>
  );
}

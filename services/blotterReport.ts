// services/blotterReport.ts
import { supabase } from '@/constants/supabase';

/** INPUT from the RN screen (includes map fields) */
export type CreateBlotterReportInput = {
  incidentSubject: string;
  incidentDesc: string;
  incidentDate: string; // 'YYYY-MM-DD'
  incidentTime: string; // 'HH:mm'

  // If you already have an address row, pass the id; otherwise pass the map fields below and we'll create one.
  incidentAddressId: number | null;

  // MAP fields coming from /mapaddress
  mapStreet?: string | null;
  mapPurok?: string | null;      // e.g. 'KANIPAAN (S01)' or 'KANIPAAN'
  mapBarangay?: string | null;
  mapCity?: string | null;
  incidentLat?: number | null;
  incidentLng?: number | null;

  complainantId: number | null;
  respondentIds: number[];
  evidenceUris?: string[]; // optional: file://… image URIs to upload
};

export type CreatedReport = { blotter_report_id: number };

/* ---------------- Utilities ---------------- */

async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Failed to read file: ${uri}`);
  return await res.blob();
}

function makeUniqueFolder(prefix = 'blotter-evidence') {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}/${Date.now()}_${rand}`;
}

export async function uploadEvidence(
  uris: string[],
  opts?: { bucket?: string; folder?: string }
): Promise<{ bucket: string; path: string }[]> {
  if (!uris?.length) return [];
  const bucket = opts?.bucket ?? 'documents';
  const base = opts?.folder ? `${opts.folder}/${makeUniqueFolder('')}` : makeUniqueFolder('blotter-evidence');

  const out: { bucket: string; path: string }[] = [];
  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    const blob = await uriToBlob(uri);
    const path = `${base}/${i}_${Date.now()}.jpg`;
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    out.push({ bucket, path });
  }
  return out;
}

/* ---------------- Address helpers (mirror your Django flow) ---------------- */

// Look up purok_sitio_id by name; accepts "KANIPAAN (S01)" or "KANIPAAN"
async function resolvePurokSitioId(purokName?: string | null): Promise<number | null> {
  if (!purokName) return null;
  const name = (purokName.split(' (', 1)[0] || purokName).trim();
  if (!name) return null;

  const { data, error } = await supabase
    .from('purok_sitio')
    .select('purok_sitio_id')
    .ilike('purok_sitio_name', name)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[Svc] resolvePurokSitioId error:', error);
    return null;
  }
  return data?.purok_sitio_id ?? null;
}

function up(s?: string | null): string | null {
  return typeof s === 'string' && s.trim() ? s.trim().toUpperCase() : null;
}

// Create an addresss row if we have lat/lng (like your web view)
async function createAddressIfNeeded(input: CreateBlotterReportInput): Promise<number | null> {
  if (input.incidentAddressId) return input.incidentAddressId;
  if (input.incidentLat == null || input.incidentLng == null) return null;

  const purokId = await resolvePurokSitioId(input.mapPurok ?? null);

  const row = {
    latitude: input.incidentLat,
    longitude: input.incidentLng,
    street: up(input.mapStreet ?? null),
    barangay: up(input.mapBarangay ?? null),
    city: up(input.mapCity ?? null),
    purok_sitio_id: purokId,
  };

  console.log('[Svc] createAddressIfNeeded insert row:', row);

  const { data, error } = await supabase
    .from('addresss') // NOTE: triple 's' per your schema
    .insert([row])
    .select('address_id')
    .single();

  if (error) {
    console.error('[Svc] createAddressIfNeeded error:', error);
    throw error;
  }

  console.log('[Svc] createAddressIfNeeded new address_id:', data?.address_id);
  return data?.address_id ?? null;
}

/* ---------------- Main: Create blotter report ---------------- */

export async function createBlotterReport(input: CreateBlotterReportInput): Promise<CreatedReport> {
  // Normalize respondent IDs
  const respondentIds = (input.respondentIds || [])
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n));

  // Upload evidence (optional)
  const evidenceArray = input.evidenceUris?.length
    ? (await uploadEvidence(input.evidenceUris)).map((x) => `${x.bucket}:${x.path}`)
    : [];

  // Ensure we have an address_id like your web flow
  const addressId = await createAddressIfNeeded(input);

  // Log the final payload we intend to send to RPC
  const debugPayload = {
    // IMPORTANT: your PostgREST hint says use p_reported_by (NOT p_staff_id)
    p_reported_by: null, // mobile → no staff
    p_incident_subject: input.incidentSubject || null,
    p_incident_desc: input.incidentDesc || null,
    p_incident_date: input.incidentDate || null,
    p_incident_time: input.incidentTime || null,
    p_incident_address_id: addressId ?? null,
    p_complainant_id: input.complainantId ?? null,
    p_respondent_ids: respondentIds.length ? respondentIds : null,
    p_evidence: evidenceArray.length ? evidenceArray : null, // jsonb
  };
  console.log('[Svc] RPC payload (create_blotter_report):', JSON.stringify(debugPayload, null, 2));

  // Call the same RPC your Django code implies but with the correct param name
  let { data, error } = await supabase.rpc('create_blotter_report', debugPayload);

  // If PostgREST complains about array typing, try a text[] style fallback for respondents
  if (error && /array|int\[\]/i.test(error.message || '')) {
    console.warn('[Svc] RPC array type error, retrying with text array cast…', error);
    const textArray = respondentIds.length ? `{${respondentIds.join(',')}}` : null; // '{1,2,3}'
    const retryPayload = { ...debugPayload, p_respondent_ids: textArray };
    console.log('[Svc] RPC retry payload:', retryPayload);
    ({ data, error } = await supabase.rpc('create_blotter_report', retryPayload));
  }

  console.log('[Svc] RPC result:', { data, error });

  if (error) throw error;

  if (typeof data === 'number') return { blotter_report_id: data };
  if (data && typeof (data as any).create_blotter_report === 'number') {
    // Some setups return the function name as key
    return { blotter_report_id: (data as any).create_blotter_report };
  }
  if (data && typeof (data as any).blotter_report_id === 'number') {
    return { blotter_report_id: (data as any).blotter_report_id };
  }

  throw new Error('RPC returned no blotter_report_id.');
}

/* ---------------- Search (unchanged) ---------------- */

export type ResidentLite = {
  person_id: number;
  full_name: string;
  person_code?: string | null;
  address?: string | null;
};

export async function searchResidents(q: string): Promise<ResidentLite[]> {
  const query = (q || '').trim();
  if (query.length < 2) return [];

  try {
    const { data, error } = await supabase.rpc('person_suggest_mobile', { q: query });
    if (!error && Array.isArray(data)) {
      return data.map((r: any) => ({
        person_id: r.person_id,
        full_name:
          r.full_name ??
          [r.first_name, r.middle_name, r.last_name, r.suffix].filter(Boolean).join(' '),
        person_code: r.person_code ?? null,
        address:
          r.address ??
          [
            r.street,
            r.purok_sitio_name ? `Purok ${r.purok_sitio_name}` : null,
            r.barangay ? `Brgy. ${r.barangay}` : null,
            r.city,
          ]
            .filter(Boolean)
            .join(', '),
      }));
    }
  } catch {
    // fall through
  }

  const { data, error } = await supabase
    .from('person')
    .select(
      `
      person_id,
      first_name,
      middle_name,
      last_name,
      suffix,
      person_code,
      addresss:addresss (
        street,
        barangay,
        city,
        purok_sitio:purok_sitio ( purok_sitio_name )
      )
    `
    )
    .or(
      [
        `first_name.ilike.%${query}%`,
        `last_name.ilike.%${query}%`,
        `person_code.ilike.%${query}%`,
      ].join(',')
    )
    .limit(25);

  if (error) throw new Error(error.message);

  return (data || []).map((p: any) => {
    const name = [p.first_name, p.middle_name, p.last_name, p.suffix].filter(Boolean).join(' ');
    const a = p.addresss || {};
    const addr = [
      a.street,
      a.purok_sitio?.purok_sitio_name ? `Purok ${a.purok_sitio.purok_sitio_name}` : null,
      a.barangay ? `Brgy. ${a.barangay}` : null,
      a.city,
    ]
      .filter(Boolean)
      .join(', ');
    return {
      person_id: p.person_id,
      full_name: name.trim(),
      person_code: p.person_code ?? null,
      address: addr || null,
    };
  });
}

// services/blotterReport.ts
import { supabase } from '@/constants/supabase';

/** INPUT from the RN screen */
export type CreateBlotterReportInput = {
  incidentSubject: string;
  incidentDesc: string;
  incidentDate: string;     // 'YYYY-MM-DD'
  incidentTime: string;     // 'HH:mm'
  incidentAddressId: number | null;
  complainantId: number | null;
  respondentIds: number[];
  evidenceUris?: string[];  // optional: file://… image URIs to upload
};

/** Minimal shape returned after creating a report */
export type CreatedReport = {
  blotter_report_id: number;
};

/** Utility: convert RN file:// URI to Blob for Supabase Storage */
async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Failed to read file: ${uri}`);
  return await res.blob();
}

/** Make a unique-ish folder (timestamp + random suffix) */
function makeUniqueFolder(prefix = 'blotter-evidence') {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}/${Date.now()}_${rand}`;
}

/** Upload attachments to Supabase Storage; returns array of {bucket, path} */
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

/**
 * Create blotter report directly in Supabase.
 * Tries RPC `create_blotter_report(...)` first (same as Django),
 * then falls back to manual inserts if the RPC isn’t available.
 */
export async function createBlotterReport(input: CreateBlotterReportInput): Promise<CreatedReport> {
  // 1) Optional: upload evidence and pass as JSONB array of storage paths
  const evidence = input.evidenceUris?.length
    ? await uploadEvidence(input.evidenceUris).then(arr => arr.map(x => `${x.bucket}:${x.path}`))
    : null;

  // 2) Try RPC (recommended; mirrors your Django call)
  try {
    const { data, error } = await supabase.rpc('create_blotter_report', {
      // change arg names here if your SQL function uses different names
      p_staff_id: null,                                       // mobile filing → no staff
      p_incident_subject: input.incidentSubject || null,
      p_incident_desc: input.incidentDesc || null,
      p_incident_date: input.incidentDate || null,
      p_incident_time: input.incidentTime || null,
      p_incident_address_id: input.incidentAddressId ?? null,
      p_complainant_id: input.complainantId ?? null,
      p_respondent_ids: input.respondentIds?.length ? input.respondentIds : null,
      p_evidence: evidence ? JSON.stringify(evidence) : null, // if your SQL expects jsonb
    });

    if (error) throw error;

    if (typeof data === 'number') return { blotter_report_id: data };
    if (data && typeof (data as any).blotter_report_id === 'number') {
      return { blotter_report_id: (data as any).blotter_report_id };
    }

    throw new Error('RPC returned no id');
  } catch {
    // 3) Fallback: manual inserts (non-transactional in PostgREST)
    // 3a) Insert header
    const { data: hdr, error: insErr } = await supabase
      .from('blotter_report')
      .insert([
        {
          incident_subject: input.incidentSubject || null,
          incident_desc: input.incidentDesc || null,
          incident_date: input.incidentDate || null,
          incident_time: input.incidentTime || null,
          incident_address_id: input.incidentAddressId ?? null,
        },
      ])
      .select('blotter_report_id')
      .single();

    if (insErr) throw new Error(insErr.message);
    const reportId = hdr!.blotter_report_id as number;

    // 3b) Link complainant (optional)
    if (input.complainantId) {
      const { error } = await supabase
        .from('complainant_report')
        .insert([{ blotter_report_id: reportId, person_id: input.complainantId }]);
      if (error) throw new Error(`complainant_report: ${error.message}`);
    }

    // 3c) Link respondents (0..n)
    if (input.respondentIds?.length) {
      const rows = input.respondentIds.map((pid) => ({
        blotter_report_id: reportId,
        person_id: pid,
      }));
      const { error } = await supabase.from('respondent_report').insert(rows);
      if (error) throw new Error(`respondent_report: ${error.message}`);
    }

    // 3d) Optional evidence table (uncomment/adjust if you have one)
    // if (evidence?.length) {
    //   const rows = evidence.map((path) => ({
    //     blotter_report_id: reportId,
    //     storage_path: path,
    //   }));
    //   const { error } = await supabase.from('blotter_report_evidence').insert(rows);
    //   if (error) throw new Error(`evidence: ${error.message}`);
    // }

    return { blotter_report_id: reportId };
  }
}

/**
 * Resident search (for complainant/respondent pickers).
 * - Works even without a custom RPC.
 * - Matches first/last name, person_code, or simple address bits.
 */
export type ResidentLite = {
  person_id: number;
  full_name: string;
  person_code?: string | null;
  address?: string | null;
};

export async function searchResidents(q: string): Promise<ResidentLite[]> {
  const query = (q || '').trim();
  if (query.length < 2) return [];

  // Optional: fast RPC if you have one
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

  // Generic PostgREST query against `person` (adjust relations if your FKs differ)
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

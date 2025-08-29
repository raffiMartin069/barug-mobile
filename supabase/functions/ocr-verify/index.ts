// supabase/functions/ocr-verify/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Payload = {
  bucket: string;
  frontPath?: string;
  backPath?: string;
  docTypeKey: string;
  first?: string;
  last?: string;
  middle?: string;
  saveResult?: boolean; // if true, insert into verification_results
};

// -------- Python ports (simplified/TS) --------
const normalize = (s = "") =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const tokenize = (s = "") => normalize(s).split(" ").filter((t) => t.length >= 2);
const anyTokenFound = (hay: string, toks: string[]) => toks.some((t) => hay.includes(t));

function isNameMatchLoose(ocrText: string, first = "", last = "", middle = "") {
  const o = normalize(ocrText);
  const firstT = tokenize(first);
  const lastT = tokenize(last);
  const middleT = tokenize(middle);
  if (!lastT.length) return { ok: false, hits: { first: false, middle: false, last: false } };
  const firstHit  = firstT.length ? anyTokenFound(o, firstT) : false;
  const lastHit   = anyTokenFound(o, lastT);
  const middleHit = middleT.length ? anyTokenFound(o, middleT) : false;
  return { ok: lastHit && (firstHit || middleHit), hits: { first: firstHit, middle: middleHit, last: lastHit } };
}

// Put real keywords here (or load from a table if you prefer)
const DOCUMENT_KEYWORDS: Record<string, string[]> = {
  // Examples:
  philid: ["philippine", "identification", "philid"],
  drivers_license: ["driver", "license", "land transportation"],
  // ...
};

function isDocTypeValid(ocrText: string, key: string) {
  const corpus = normalize(ocrText);
  const kws = DOCUMENT_KEYWORDS[key] || [];
  if (!kws.length) return false;
  let hits = 0;
  for (const kw of kws) if (corpus.includes(normalize(kw))) hits++;
  return hits >= (kws.length <= 2 ? kws.length : 2);
}

// --- OCR via OCR.space (fast to test). Swap with Vision if needed.
async function ocrImageByUrl(url: string, apiKey: string) {
  const form = new URLSearchParams();
  form.set("url", url);
  form.set("OCREngine", "2");
  form.set("scale", "true");
  form.set("isTable", "false");

  const resp = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { apikey: apiKey, "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const json = await resp.json();
  const text = json?.ParsedResults?.[0]?.ParsedText || "";
  return text as string;
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ocrKey      = Deno.env.get("OCRSPACE_API_KEY")!; // or use Vision envs

    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    const userRes = await supabase.auth.getUser(jwt);
    const user = userRes.data.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

    const body = (await req.json()) as Payload;
    const paths = [body.frontPath, body.backPath].filter(Boolean) as string[];

    // Create signed URLs so the OCR provider can fetch the images
    const signedUrls: string[] = [];
    for (const p of paths) {
      const { data, error } = await supabase.storage.from(body.bucket).createSignedUrl(p, 60 * 10);
      if (error) throw error;
      signedUrls.push(data.signedUrl);
    }

    // OCR
    const texts: string[] = [];
    for (const url of signedUrls) {
      texts.push(await ocrImageByUrl(url, ocrKey));
    }
    const textFront = texts[0] ?? "";
    const textBack  = texts[1] ?? "";

    const primary   = textFront.length >= textBack.length ? textFront : textBack;
    const combined  = (textFront + " " + textBack).trim();
    const corpus    = primary || combined;

    const docTypeOk = isDocTypeValid(corpus, body.docTypeKey);
    let nameOk: boolean | null = null;
    let nameHits: { first: boolean; middle: boolean; last: boolean } | null = null;

    if (body.first || body.last || body.middle) {
      const r = isNameMatchLoose(corpus, body.first ?? "", body.last ?? "", body.middle ?? "");
      nameOk = r.ok; nameHits = r.hits;
    }

    const ok = nameOk === null ? docTypeOk : (docTypeOk && nameOk);

    // Optional: save to DB
    if (body.saveResult) {
      await supabase.from("verification_results").insert({
        user_id: user.id,
        doc_type_key: body.docTypeKey,
        front_path: body.frontPath ?? null,
        back_path: body.backPath ?? null,
        which_matched: textFront.length >= textBack.length ? "front" : "back",
        text_front: textFront,
        text_back: textBack,
        doc_type_ok: docTypeOk,
        name_ok: nameOk,
        name_hits: nameHits,
        ok
      });
    }

    return new Response(JSON.stringify({
      ok,
      doc_type_ok: docTypeOk,
      name_ok: nameOk,
      name_hits: nameHits,
      text_front: textFront,
      text_back: textBack,
      which_matched: textFront.length >= textBack.length ? "front" : "back",
      reason: !docTypeOk
        ? "Document text does not match expected ID type."
        : (nameOk === false
            ? (nameHits
               ? `Name not fully detected: ${[
                    !nameHits.last ? "last name" : null,
                    !(nameHits.first || nameHits.middle) ? "first or middle name" : null
                  ].filter(Boolean).join(", ")}`
               : "Name not detected on the ID.")
            : "")
    }), { headers: { "Content-Type": "application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500 });
  }
});

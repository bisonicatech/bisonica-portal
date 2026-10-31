// Clocka: RevenueCat webhook (Supabase Edge Function).
//
// RevenueCat calls this whenever a subscription is bought, renewed, cancelled, refunded,
// expires or is restored. The function never trusts the message itself: it checks the
// secret Authorization header, then asks RevenueCat directly when each affected
// household's Premium ends, and saves that on Clocka's server.
//
// Secrets (Supabase dashboard → Edge Functions → Secrets):
//   RC_WEBHOOK_AUTH  the same long random value you type into RevenueCat's webhook
//                    "Authorization header value"
//   RC_SECRET_KEY    RevenueCat secret API key (starts with sk_)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
// Deploy with "Verify JWT" turned OFF (RevenueCat can't send a Supabase login).

const ENTITLEMENT = 'premium';
const HOUSEHOLD_ID = /^household_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

/** Compare secrets without leaking how much matched through timing. */
function sameSecret(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** When Premium ends for this RevenueCat customer, or null if they don't have it. */
async function premiumUntil(appUserId: string, rcKey: string): Promise<string | null> {
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${rcKey}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`RevenueCat ${res.status}`);
  const body = await res.json();
  const ent = body?.subscriber?.entitlements?.[ENTITLEMENT];
  if (!ent) return null;
  // No end date means a lifetime purchase.
  return ent.expires_date ?? '2100-01-01T00:00:00Z';
}

async function savePremium(householdId: string, until: string | null) {
  const url = Deno.env.get('SUPABASE_URL')!;
  // Supabase provides its server key automatically. If it ever doesn't, add your
  // sb_secret_ key yourself as the secret CLOCKA_SERVICE_KEY.
  const key = Deno.env.get('CLOCKA_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!key) throw new Error('No Supabase server key: add the CLOCKA_SERVICE_KEY secret');
  const res = await fetch(`${url}/rest/v1/rpc/dg_rc_set_premium`, {
    method: 'POST',
    headers: {
      apikey: key,
      // Legacy service keys are JWTs; new secret keys (sb_secret_…) go in apikey only.
      ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_household: householdId, p_until: until }),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const expected = Deno.env.get('RC_WEBHOOK_AUTH') ?? '';
  const rcKey = Deno.env.get('RC_SECRET_KEY') ?? '';
  if (expected.length < 20 || !rcKey) return new Response('Webhook not configured', { status: 500 });
  if (!sameSecret(req.headers.get('Authorization') ?? '', expected)) return new Response('Unauthorized', { status: 401 });

  let event: Record<string, unknown>;
  try {
    event = (await req.json())?.event ?? {};
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  // Every customer this event touches (a restore moves a purchase between customers).
  const ids = new Set<string>();
  for (const field of ['app_user_id', 'original_app_user_id']) {
    if (typeof event[field] === 'string') ids.add(event[field] as string);
  }
  for (const field of ['aliases', 'transferred_from', 'transferred_to']) {
    const list = event[field];
    if (Array.isArray(list)) list.forEach((v) => typeof v === 'string' && ids.add(v));
  }

  const updated: string[] = [];
  try {
    for (const id of ids) {
      const m = HOUSEHOLD_ID.exec(id);
      if (!m) continue;
      await savePremium(m[1], await premiumUntil(id, rcKey));
      updated.push(m[1]);
    }
  } catch (e) {
    // RevenueCat retries failed webhooks, so a temporary problem fixes itself.
    console.error(e);
    return new Response('Try again later', { status: 500 });
  }

  return Response.json({ ok: true, updated: updated.length });
});

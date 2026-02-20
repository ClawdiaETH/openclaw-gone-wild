import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRICE_ID = 'price_1T2yvSLECHmgJcHTyztuGHca';
const PRINTIFY_PRODUCT_ID = '6998a9e635ddad0d0308cebd';

const VARIANT_IDS: Record<string, number> = {
  S:    18100,
  M:    18101,
  L:    18102,
  XL:   18103,
  '2XL':18104,
};

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Stripe not configured', detail: 'STRIPE_SECRET_KEY missing' }, { status: 500 });
  }

  let size: string;
  let wallet: string = '';
  try {
    const body = await req.json();
    size = body.size;
    wallet = (body.wallet ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!size || !VARIANT_IDS[size]) {
    return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
  }

  const variantId = VARIANT_IDS[size];
  const base = 'https://api.stripe.com/v1/checkout/sessions';

  // Build URL-encoded form body (Stripe REST API uses application/x-www-form-urlencoded)
  const params = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': PRICE_ID,
    'line_items[0][quantity]': '1',
    'shipping_address_collection[allowed_countries][0]': 'US',
    'shipping_address_collection[allowed_countries][1]': 'CA',
    'shipping_address_collection[allowed_countries][2]': 'GB',
    'shipping_address_collection[allowed_countries][3]': 'AU',
    'shipping_address_collection[allowed_countries][4]': 'DE',
    'shipping_address_collection[allowed_countries][5]': 'FR',
    'shipping_address_collection[allowed_countries][6]': 'NL',
    'shipping_address_collection[allowed_countries][7]': 'SE',
    'shipping_address_collection[allowed_countries][8]': 'JP',
    'shipping_address_collection[allowed_countries][9]': 'SG',
    'metadata[size]': size,
    'metadata[printify_product_id]': PRINTIFY_PRODUCT_ID,
    'metadata[printify_variant_id]': String(variantId),
    ...(wallet ? { 'metadata[wallet_address]': wallet } : {}),
    success_url: 'https://agentfails.wtf/merch/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://agentfails.wtf/merch',
  });

  try {
    const res = await fetch(base, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json() as any;

    if (!res.ok) {
      console.error('Stripe API error:', data);
      return NextResponse.json({
        error: 'Failed to create checkout session',
        detail: data?.error?.message ?? JSON.stringify(data),
      }, { status: 500 });
    }

    return NextResponse.json({ url: data.url });
  } catch (err: any) {
    console.error('Fetch error:', err);
    return NextResponse.json({
      error: 'Failed to create checkout session',
      detail: err?.message ?? String(err),
    }, { status: 500 });
  }
}

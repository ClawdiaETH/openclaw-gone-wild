import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const PRICE_ID = 'price_1T2yvSLECHmgJcHTyztuGHca';
const PRINTIFY_PRODUCT_ID = '6998a9e635ddad0d0308cebd';

const VARIANT_IDS: Record<string, number> = {
  S: 18100,
  M: 18101,
  L: 18102,
  XL: 18103,
  '2XL': 18104,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const size: string = body.size;

    if (!size || !VARIANT_IDS[size]) {
      return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
    }

    const variantId = VARIANT_IDS[size];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      shipping_address_collection: {
        allowed_countries: [
          'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK', 'FI', 'JP', 'SG', 'NZ',
        ],
      },
      metadata: {
        size,
        printify_product_id: PRINTIFY_PRODUCT_ID,
        printify_variant_id: String(variantId),
      },
      success_url: `https://agentfails.wtf/merch/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://agentfails.wtf/merch`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

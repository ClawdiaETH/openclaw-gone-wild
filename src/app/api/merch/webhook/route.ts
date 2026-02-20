import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const PRINTIFY_SHOP_ID = '5856939';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutCompleted(session);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    // In Stripe API 2026-01-28.clover, shipping info is under collected_information
    const shippingDetails = session.collected_information?.shipping_details;
    const address = shippingDetails?.address;
    const customerName = shippingDetails?.name ?? '';
    const customerEmail = session.customer_details?.email ?? '';

    const size = session.metadata?.size ?? 'M';
    const productId = session.metadata?.printify_product_id;
    const variantId = Number(session.metadata?.printify_variant_id);

    if (!address || !productId || !variantId) {
      console.error('Missing required data from session:', {
        address,
        productId,
        variantId,
        sessionId: session.id,
      });
      return;
    }

    // Split name into first/last (best effort)
    const nameParts = customerName.trim().split(' ');
    const firstName = nameParts[0] ?? customerName;
    const lastName = nameParts.slice(1).join(' ');

    const printifyOrder = {
      external_id: session.id,
      label: `faceclaw tee - ${size}`,
      line_items: [
        {
          product_id: productId,
          variant_id: variantId,
          quantity: 1,
        },
      ],
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: firstName,
        last_name: lastName,
        email: customerEmail,
        phone: '',
        country: address.country ?? '',
        region: address.state ?? '',
        address1: address.line1 ?? '',
        address2: address.line2 ?? '',
        city: address.city ?? '',
        zip: address.postal_code ?? '',
      },
    };

    const resp = await fetch(
      `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/orders.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`,
        },
        body: JSON.stringify(printifyOrder),
      },
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Printify order creation failed:', resp.status, errText);
      return;
    }

    const order = await resp.json();
    console.log('✅ Printify order created:', order.id, '| Stripe session:', session.id);
  } catch (err) {
    console.error('Error handling checkout.session.completed:', err);
  }
}

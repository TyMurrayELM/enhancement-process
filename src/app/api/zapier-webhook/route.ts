import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error('ZAPIER_WEBHOOK_URL not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Get the payload from the request
    const payload = await request.json();

    // Send to Zapier
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Zapier webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send notification' },
      { status: 500 }
    );
  }
}
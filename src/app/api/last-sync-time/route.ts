import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
    
    // Enhanced logging to debug the issue
    console.log('Zapier webhook triggered');
    console.log('Webhook URL exists:', !!webhookUrl);
    console.log('Webhook URL (masked):', webhookUrl ? `${webhookUrl.substring(0, 30)}...` : 'undefined');
    
    if (!webhookUrl) {
      console.error('ZAPIER_WEBHOOK_URL not configured in environment variables');
      return NextResponse.json(
        { error: 'Webhook not configured - check environment variables' },
        { status: 500 }
      );
    }

    // Get the payload from the request
    const payload = await request.json();
    console.log('Payload received:', JSON.stringify(payload, null, 2));

    // Send to Zapier with timeout
    console.log('Sending request to Zapier...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Zapier response status:', response.status);
      console.log('Zapier response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('Zapier webhook failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`Zapier webhook failed with status ${response.status}: ${errorText}`);
      }

      const responseData = await response.text();
      console.log('Zapier response:', responseData);

      return NextResponse.json({ 
        success: true,
        message: 'Notification sent successfully'
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Zapier webhook timeout after 10 seconds');
        throw new Error('Zapier webhook timeout - request took too long');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Zapier webhook error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to send notification',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
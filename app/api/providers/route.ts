import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    providers: {
      domain: { status: 'available', source: 'IRIS DNS and HTTPS evidence engine' },
      phone: { status: process.env.ABSTRACT_API_KEY ? 'available' : 'not_configured', source: 'https://www.abstractapi.com/phone-validation-api' },
      email: { status: process.env.Intelligence_x_key ? 'available' : 'not_configured', source: 'https://intelx.io/' },
      bluesky: { status: 'available', source: 'https://docs.bsky.app/' },
      certificateTransparency: { status: 'available', source: 'https://crt.sh/' },
      urlscan: { status: process.env.URLSCAN_API_KEY ? 'available' : 'optional_not_configured', source: 'https://urlscan.io/docs/api/' },
      groqRemediation: { status: process.env.AI_GATEWAY_API_KEY ? 'available' : 'local_fallback', source: 'https://vercel.com/docs/ai-gateway' },
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}

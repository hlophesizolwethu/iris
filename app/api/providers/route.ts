import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    providers: {
      domain: { status: 'available', source: 'IRIS DNS and HTTPS evidence engine' },
      phone: { status: process.env.ABSTRACT_API_KEY ? 'available' : 'not_configured', source: 'https://www.abstractapi.com/phone-validation-api' },
      email: { status: process.env.Intelligence_x_key ? 'available' : 'not_configured', source: 'https://intelx.io/' },
      bluesky: { status: 'available', source: 'https://docs.bsky.app/' },
      censys: { status: process.env.CENSYS_API_ID && process.env.CENSYS_API_SECRET ? 'available' : 'needs_api_id_and_secret', source: 'https://docs.censys.com/docs/assessment-api' },
      groqRemediation: { status: process.env.AI_GATEWAY_API_KEY ? 'available' : 'local_fallback', source: 'https://vercel.com/docs/ai-gateway' },
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}

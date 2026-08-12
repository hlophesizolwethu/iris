import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    providers: {
      domain: { status: 'available', source: 'IRIS DNS and HTTPS evidence engine' },
      phone: { status: process.env.ABSTRACT_PHONE_API_KEY || process.env.ABSTRACT_API_KEY ? 'available' : 'not_configured', key: process.env.ABSTRACT_PHONE_API_KEY ? 'ABSTRACT_PHONE_API_KEY' : process.env.ABSTRACT_API_KEY ? 'ABSTRACT_API_KEY (legacy)' : null, source: 'https://www.abstractapi.com/phone-validation-api' },
      email: { status: 'available', source: 'https://xposedornot.com/' },
      emailValidation: { status: process.env.ABSTRACT_EMAIL_API_KEY ? 'available' : 'not_configured', key: process.env.ABSTRACT_EMAIL_API_KEY ? 'ABSTRACT_EMAIL_API_KEY' : null, source: 'https://www.abstractapi.com/email-verification-api' },
      bluesky: { status: 'available', source: 'https://docs.bsky.app/' },
      github: { status: 'public_api_available', source: 'https://docs.github.com/en/rest/users/users' },
      mastodon: { status: 'not_configured', source: 'https://docs.joinmastodon.org/api/' },
      holehe: { status: 'not_configured', source: 'https://github.com/megadose/holehe' },
      certificateTransparency: { status: 'available', source: 'https://crt.sh/', description: 'Certificate Transparency hostname evidence used in domain scans.' },
      urlscan: { status: process.env.URLSCAN_API_KEY ? 'available' : 'optional_not_configured', source: 'https://urlscan.io/docs/api/' },
      groqRemediation: { status: process.env.AI_GATEWAY_API_KEY ? 'available' : 'local_fallback', source: 'https://vercel.com/docs/ai-gateway' },
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}

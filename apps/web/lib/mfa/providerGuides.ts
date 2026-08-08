import type { EmailProvider, MfaGuide } from '@packages/types'

// IRIS never requests, stores, or transmits credentials. These guides only
// deep-link to each provider's own official settings pages — the user
// authenticates directly with the provider, never through IRIS.

const GUIDES: Record<EmailProvider, MfaGuide> = {
  google_workspace: {
    provider: 'google_workspace',
    displayName: 'Google Workspace',
    steps: [
      {
        key: 'gw_admin_enforce',
        title: 'Enforce 2-Step Verification org-wide (Admin)',
        description:
          'If you administer this Workspace, turn on 2-Step Verification enforcement for all users from the Admin console rather than relying on individuals to opt in.',
        externalUrl: 'https://admin.google.com/ac/security/2step',
      },
      {
        key: 'gw_user_enable',
        title: 'Turn on 2-Step Verification (individual account)',
        description:
          'Each user can enable 2-Step Verification directly on their Google Account security page — an authenticator app is recommended over SMS.',
        externalUrl: 'https://myaccount.google.com/signinoptions/two-step-verification',
      },
      {
        key: 'gw_security_keys',
        title: 'Consider security keys for high-privilege accounts',
        description:
          'For admins and finance/executive accounts, hardware security keys (or Google\u2019s built-in passkeys) offer stronger protection than app-based codes.',
        externalUrl: 'https://myaccount.google.com/security',
      },
    ],
  },
  microsoft_365: {
    provider: 'microsoft_365',
    displayName: 'Microsoft 365',
    steps: [
      {
        key: 'm365_security_defaults',
        title: 'Enable Security Defaults or Conditional Access (Admin)',
        description:
          'Security Defaults gives every user baseline MFA enforcement with one toggle; larger organisations should graduate to Conditional Access policies for finer control.',
        externalUrl: 'https://entra.microsoft.com',
      },
      {
        key: 'm365_user_enable',
        title: 'Set up the Microsoft Authenticator app',
        description:
          'Individual users can register a second factor directly from their Microsoft account security page.',
        externalUrl: 'https://mysignins.microsoft.com/security-info',
      },
      {
        key: 'm365_legacy_auth',
        title: 'Block legacy authentication protocols',
        description:
          'Legacy auth (POP/IMAP/SMTP basic auth) bypasses MFA entirely and is a common attacker route \u2014 disable it once modern auth is confirmed working for all apps.',
        externalUrl: 'https://learn.microsoft.com/entra/identity/conditional-access/block-legacy-authentication',
      },
    ],
  },
  zoho: {
    provider: 'zoho',
    displayName: 'Zoho Mail',
    steps: [
      {
        key: 'zoho_org_policy',
        title: 'Enforce Multi-Factor Authentication org-wide (Admin)',
        description:
          'Zoho\u2019s admin console lets you require MFA for all users under Security Control.',
        externalUrl: 'https://accounts.zoho.com/home#security/mfa',
      },
      {
        key: 'zoho_user_enable',
        title: 'Enable MFA on your account',
        description:
          'Individual users can add an authenticator app or security key from their Zoho Account security settings.',
        externalUrl: 'https://accounts.zoho.com/home#security',
      },
    ],
  },
  self_hosted: {
    provider: 'self_hosted',
    displayName: 'Self-hosted / other mail provider',
    steps: [
      {
        key: 'selfhosted_check_panel',
        title: 'Check your mail server\u2019s admin panel for MFA support',
        description:
          'Most modern mail platforms (e.g. Roundcube with a 2FA plugin, Zimbra, Postfix + external IdP) support MFA via a plugin or an upstream identity provider \u2014 check your specific platform\u2019s documentation.',
        externalUrl: 'https://www.cisa.gov/MFA',
      },
      {
        key: 'selfhosted_sso',
        title: 'Consider fronting mail with an SSO/identity provider',
        description:
          'If your platform lacks native MFA, putting an identity provider (e.g. an OIDC/SAML SSO layer) in front of webmail login is a reliable way to add enforced MFA.',
        externalUrl: 'https://www.cisa.gov/MFA',
      },
    ],
  },
  unknown: {
    provider: 'unknown',
    displayName: 'General guidance',
    steps: [
      {
        key: 'generic_top5',
        title: 'Secure your top 5 accounts first',
        description:
          'Start with email, banking, social media, cloud storage, and any account tied to password resets for everything else \u2014 enable MFA on those before anything else.',
        externalUrl: 'https://www.cisa.gov/MFA',
      },
      {
        key: 'generic_authenticator',
        title: 'Prefer an authenticator app over SMS',
        description:
          'SMS codes can be intercepted via SIM-swap attacks. An authenticator app (or a hardware security key) is meaningfully stronger.',
        externalUrl: 'https://www.cisa.gov/MFA',
      },
    ],
  },
}

export function getMfaGuide(provider: EmailProvider): MfaGuide {
  return GUIDES[provider]
}

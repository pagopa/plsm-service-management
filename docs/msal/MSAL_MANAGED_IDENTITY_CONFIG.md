// apps/sm-auth-fn/\_shared/msalConfig.ts
import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';
import { ManagedIdentityCredential } from '@azure/identity';

const useManagedIdentity = process.env.USE_MANAGED_IDENTITY === 'true';

const msalConfig: Configuration = {
auth: {
clientId: process.env.MSAL_CLIENT_ID!,
authority: `https://login.microsoftonline.com/${process.env.MSAL_TENANT_ID}`,
// When using Managed Identity, we don't need clientSecret
...(useManagedIdentity
? {
// Managed Identity will automatically handle authentication
clientAssertion: async () => {
const credential = new ManagedIdentityCredential();
const token = await credential.getToken('https://graph.microsoft.com/.default');
return token.token;
}
}
: {
// Fallback to client secret for local development
clientSecret: process.env.MSAL_CLIENT_SECRET!,
}
),
},
system: {
loggerOptions: {
loggerCallback: (level, message, containsPii) => {
if (containsPii) return;
console.log(`[MSAL] ${message}`);
},
piiLoggingEnabled: false,
logLevel: process.env.NODE_ENV === 'production' ? 3 : 2, // Error in prod, Trace in dev
},
},
};

export const msalClient = new ConfidentialClientApplication(msalConfig);

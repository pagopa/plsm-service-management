import { ManagedIdentityCredential, AccessToken } from '@azure/identity';

/** Crea la credenziale MSI (System Assigned o User Assigned se configurata). */
export function createManagedIdentityCredential(): ManagedIdentityCredential {
  console.log('Usando ManagedIdentityCredential (System-Assigned per default)');
  return new ManagedIdentityCredential(); // nessun parametro richiesto
}

/** Recupera un access token per lo scope passato. */
export async function getAccessToken(
  credential: ManagedIdentityCredential,
  scope: string
): Promise<string> {
  console.log('Richiesta access token MSI...');
  try {
    const tokenResponse: AccessToken | null = await credential.getToken(scope);
    if (!tokenResponse?.token) {
      throw new Error('Token non ricevuto dalla Managed Identity');
    }
    const expiresOn = new Date(tokenResponse.expiresOnTimestamp);
    console.log('Access token ottenuto. Scadenza:', expiresOn.toISOString());
    return tokenResponse.token;
  } catch (error: unknown) {
    console.error('Errore ottenimento token:', error);

    if (error instanceof Error) {
      if (error.message.includes('ManagedIdentityCredential')) {
        throw new Error(
          'Managed Identity non disponibile o non configurata.\n' +
            'Verifica:\n' +
            '1) App Service: Identity → System Assigned = On\n' +
            "2) L'identità ha permessi su Dataverse/Dynamics (Application User/ruoli)"
        );
      }
      if (error.message.includes('AADSTS')) {
        throw new Error(`Errore Azure AD: ${error.message}\nVerifica lo scope e le federazioni.`);
      }
    }
    // Se non è un Errore o non corrisponde, rilancia l'errore originale
    throw error;
  }
}

/** Effettua la GET su Dynamics/Dataverse. */
export async function callDynamicsApi(url: string, accessToken: string) {
  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Content-Type': 'application/json; charset=utf-8',
        Prefer: 'return=representation',
      },
      cache: 'no-store',
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Errore Dynamics:', text);
      throw new Error(
        `Errore Dynamics API (${resp.status}): ${text}\n` +
          `Controlla ruoli/permessi e l'URL: ${url}`
      );
    }
    return await resp.json();
  } catch (e: unknown) {
    console.error('Errore chiamata API:', e);
    throw e;
  }
}

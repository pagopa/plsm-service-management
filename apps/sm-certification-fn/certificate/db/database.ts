// File: database.ts

import { Client } from 'pg';
import { AppConfig } from '../../utils/checkConfig';


/**
 * Crea una nuova istanza del client, si connette al database
 * e restituisce il client connesso.
 * @returns Una Promise che si risolve con l'istanza del Client connesso.
 */
export const getConnectedClient = async (config: AppConfig): Promise<Client> =>{
  // Configura i dettagli della connessione
  const client = new Client({
    user: config.dbuser,
    host: config.host,
    database: config.dbname,
    password: config.dbpassword,
    port: config.port,
    ssl: config.dbssl,
  });

  try {
    // Tenta la connessione
    await client.connect();
    console.log('✅ Client connesso al database.');
    return client;
  } catch (error) {
    console.error('❌ Impossibile connettersi al database:', error);
    // Rilancia l'errore per permettere al chiamante di gestirlo
    throw error;
  }
}
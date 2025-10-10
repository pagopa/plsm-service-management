const messages = {
  errors: {
    generic:
      ':exclamation: Si è verificato un errore, riprova più tardi. :exclamation:',
  },
  users: {
    notFound: ':x: Utente non presente su Area Riservata :x:',
    fileGeneration:
      'Stiamo generando un file con la lista degli utenti, a breve lo riceverai in chat.',
    error: 'Per qualche motivo non sono riuscito a inviare il file.',
  },
  auth: {
    unauthorized:
      "Non sei autorizzato ad utilizzare questo comando, richiedi l'accesso scrivendoci sul canale IO Service Management.",
  },
  validation: {
    fiscalCode: {
      generic: 'Il codice fiscale deve essere un codice di 11 numeri.',
    },
  },
  institution: {
    notFound:
      ':exclamation: Ente non presente, non esiste un aderente con questo codice fiscale su Area Riservata :exclamation:',
  },
  product: {
    notFound: ':exclamation: Prodotto non trovato :exclamation:',
  },
  contract: {
    notFound: 'Contratto non trovato.',
    emailSent:
      'Ti abbiamo inviato una mail contenente il contratto. :incoming_envelope:',
    error: 'Si è verificato un errore durante la lettura del contratto.',
  },
}

export default messages

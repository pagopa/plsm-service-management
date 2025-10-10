// jest.setup.js

// Stringhe semplici
process.env.APPINSIGHTS_CONNECTION_STRING = 'InstrumentationKey=dummy-key;';
process.env.SERVICENAME = 'sm-ask-me-fn-test';
process.env.SLACK_BOT_TOKEN = 'dummy-slack-bot-token';
process.env.SLACK_SIGNING_SECRET = 'dummy-slack-signing-secret';
process.env.SLACK_API_URL = 'https://slack.com/api/';
process.env.INSTITUTION_URL = 'http://localhost/institutions';
process.env.USERS_URL = 'http://localhost/users';
process.env.CONTRACT_URL = 'http://localhost/contracts';
process.env.OCP_APIM_SUBSCRIPTION_KEY = 'dummy-ocp-key';
process.env.USERS_APIM_SUBSCRIPTION_KEY = 'dummy-users-key';
process.env.CONTRACT_APIM_SUBSCRIPTION_KEY = 'dummy-contract-key';
process.env.SMTP_HOST = 'smtp.example.com';
process.env.SMTP_USERNAME = 'user@example.com';
process.env.SMTP_PASSWORD = 'dummy-password';
process.env.FROM_EMAIL = 'from@example.com';
process.env.CCN_EMAIL = 'ccn@example.com';

// Stringhe che vengono trasformate in array
// Zod si aspetta una stringa separata da punto e virgola
process.env.ENABLED_EMAILS_SECRET = 'test1@example.com;test2@example.com';
process.env.LEGAL_ENABLED_EMAILS_SECRET = 'legal1@example.com;legal2@example.com';

// Valori che vengono pre-processati in numeri
// Devono essere forniti come stringhe
process.env.APPINSIGHTS_SAMPLING_PERCENTAGE = '5';
process.env.SMTP_PORT = '587';
process.env.MAX_DATA_LENGTH = '1024';

// Valore che viene pre-processato in booleano
// Deve essere una stringa 'true' or 'false'
process.env.SMTP_SECURE = 'true';
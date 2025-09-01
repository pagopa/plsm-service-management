
// interface Certificate {
//     idp: string;
//     use: string;
//     expiration_date: string; // oppure Date se già convertita
//     days_remaining: number;
//     certificate: string;
// }

// export type CertificatesByExpiration = {
//     [expiration: string]: Certificate[];
// };

// Definiamo i tipi per un output pulito e prevedibile
export interface CertificateInfo {
  idp: string;
  use: "signing" | "encryption" | "unknown";
  expirationDate: string; // Formato YYYY-MM-DD
  daysRemaining: number;
  certificate: string; // Base64 del certificato
}

export type CertificatesByExpiration = Map<string, CertificateInfo[]>;
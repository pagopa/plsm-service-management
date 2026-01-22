import type { Contact, DynamicsList } from "../types/dynamics";
import { get, buildUrl } from "./httpClients";

export async function listContacts(params?: {
  filter?: string;
  select?: string;
  top?: string;
}): Promise<DynamicsList<Contact>> {
  const url = buildUrl({
    endpoint: "/api/data/v9.2/contacts",
    filter: params?.filter,
    select:
      params?.select ?? "contactid,fullname,emailaddress1,firstname,lastname",
    top: params?.top,
  });

  console.log(`Fetching contacts from: ${url}`);
  return get<Contact>(url);
}

export async function getContactById(
  contactId: string,
): Promise<Contact | null> {
  const url = buildUrl({
    endpoint: `/api/data/v9.2/contacts(${contactId})`,
    select: "contactid,fullname,emailaddress1,firstname,lastname,telephone1",
  });

  console.log(`Fetching contact: ${contactId}`);

  try {
    const result = await get<Contact>(url);
    return result.value?.[0] ?? (result as unknown as Contact);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("404")) {
      return null;
    }
    throw error;
  }
}

export async function searchContactsByEmail(
  email: string,
): Promise<DynamicsList<Contact>> {
  return listContacts({
    filter: `emailaddress1 eq '${email}'`,
  });
}

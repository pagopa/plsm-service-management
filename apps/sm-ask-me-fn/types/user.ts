import { z } from 'zod'
import { Roles } from './roles'
import { getRoleLabel } from '../utils/getRoleLabel'

export const schema = z.object({
  id: z.string(),
  name: z.string(),
  surname: z.string(),
  email: z.string().email(),
  roles: z.enum([Roles.ADMIN, Roles.OPERATOR]),
  role: z.string(),
})

export interface PrintableUser {
  name: string
  surname: string
  role: string
  email: string
}

export const getPrintableUser = (user: User): PrintableUser => {
  const role = user.roles?.[0]
    ? getRoleLabel(user.roles[0] as Roles, user.role === 'MANAGER')
    : 'Ruolo Assente'
  const name = user.name ?? 'No Nome'
  const surname = user.surname ?? 'No Cognome'
  const email = (user.email ?? 'No Email').toLowerCase()

  return { name, surname, role, email }
}

export type User = z.infer<typeof schema>

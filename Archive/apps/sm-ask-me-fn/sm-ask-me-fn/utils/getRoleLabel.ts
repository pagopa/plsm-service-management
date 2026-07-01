import { Roles } from '../types/roles'

export const getRoleLabel = (role: Roles, isManager: boolean) => {
  switch (role) {
    case Roles.ADMIN: {
      return isManager ? 'Manager' : 'Amministratore'
    }

    case Roles.API:
    case Roles.SECURITY: {
      return `Operatore ${role}`
    }

    default: {
      return role.charAt(0).toUpperCase() + role.slice(1)
    }
  }
}

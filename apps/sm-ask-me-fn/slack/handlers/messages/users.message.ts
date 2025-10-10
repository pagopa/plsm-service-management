import { KnownBlock } from '@slack/bolt'
import { getPrintableUser, User } from '../../../types/user'
import { getHeaderBlock } from '../../../utils/getHeaderBlock'

const getUsersMessage = (users: Array<User>) => {
  const blocks: Array<KnownBlock> = getHeaderBlock('Utenti')

  // Ordina gli utenti per nome
  const sortedUsers = sortingUsersByName(users)

  // Raggruppa e riordina per ruolo (admin prima)
  const groupedUsers = groupUsersByRole(sortedUsers)
  const sortedByRoleAndName = getSortedUsers(groupedUsers)

  // Crea i blocchi del messaggio
  const userBlocks = sortedByRoleAndName.map(formatUserBlock)

  return { blocks: [...blocks, ...userBlocks] }
}

export default getUsersMessage

const sortingUsersByName = (users: User[]): User[] => {
  return [...users].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
}

const groupUsersByRole = (users: User[]): Record<string, User[]> => {
  return users.reduce<Record<string, User[]>>((result, user) => {
    const role = user.roles?.[0] ?? 'no-role'
    return {
      ...result,
      [role]: [...(result[role] ?? []), user],
    }
  }, {})
}

const getSortedUsers = (groupedUsers: Record<string, User[]>): User[] => {
  const { admin = [], ...otherRoles } = groupedUsers
  const otherUsers = Object.values(otherRoles).flat()
  return [...admin, ...otherUsers]
}

const formatUserBlock = (user: User): KnownBlock => {
  const { name, surname, role, email } = getPrintableUser(user)

  return {
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `\`${role}\` ${name} ${surname}`,
      },
      {
        type: 'mrkdwn',
        text: email,
      },
    ],
  }
}

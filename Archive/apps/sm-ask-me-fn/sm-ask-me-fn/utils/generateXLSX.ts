import Excel from 'exceljs'
import { getPrintableUser, User } from '../types/user'

const generateXLSX = async (users: Array<User>, width: number) => {
  const workbook = new Excel.Workbook()
  var worksheet = workbook.addWorksheet('My Sheet')
  worksheet.columns = [
    { header: 'Name', key: 'name', width },
    {
      header: 'Surname',
      key: 'surname',
      width,
    },
    { header: 'Email', key: 'email', width },
    { header: 'Role', key: 'role', width },
  ]

  users.forEach((user) => {
    const { name, surname, role, email } = getPrintableUser(user)

    worksheet.addRow({
      name,
      surname,
      role,
      email,
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export default generateXLSX

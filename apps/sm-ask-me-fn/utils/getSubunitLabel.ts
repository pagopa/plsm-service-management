import SubunitCodes from '../types/subunit-codes'

const getSubunitLabel = (subunitCode: SubunitCodes): string => {
  switch (subunitCode) {
    case SubunitCodes.AOO:
      return 'Area Organizzativa Omogenea'
    case SubunitCodes.UO:
      return 'Unità Organizzativa'
    default:
      return subunitCode
  }
}

export default getSubunitLabel

import { equal } from 'node:assert/strict'
import { findProductGuid } from '../_shared/utils/mappings'

const map = {
  'prod-io': '11111111-1111-1111-1111-111111111111',
  'io-fims': '22222222-2222-2222-2222-222222222222',
  'IT-WALLET': '33333333-3333-3333-3333-333333333333',
}

describe('findProductGuid', () => {
  it('finds an exact key', () => {
    equal(findProductGuid(map, 'prod-io'), '11111111-1111-1111-1111-111111111111')
  })

  it('finds a lowercase key for an uppercase productId', () => {
    equal(findProductGuid(map, 'IO-FIMS'), '22222222-2222-2222-2222-222222222222')
  })

  it('finds an uppercase key for a lowercase productId', () => {
    equal(findProductGuid(map, 'it-wallet'), '33333333-3333-3333-3333-333333333333')
  })

  it('prefers the exact key when both cases are present', () => {
    const both = { 'EUDI-WALLET': 'exact', 'eudi-wallet': 'lower' }
    equal(findProductGuid(both, 'EUDI-WALLET'), 'exact')
  })

  it('returns undefined for a missing product', () => {
    equal(findProductGuid(map, 'EUDI-WALLET'), undefined)
  })

  it('ignores inherited object properties', () => {
    equal(findProductGuid(map, 'constructor'), undefined)
  })
})

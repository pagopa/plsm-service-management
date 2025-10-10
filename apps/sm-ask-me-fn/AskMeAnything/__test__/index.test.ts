import { HttpRequest, InvocationContext } from '@azure/functions'
import { handler } from '../handler'

const mockContext = {
  log: jest.fn(),
  executionContext: { functionName: jest.fn() },
} as unknown as InvocationContext

export const buildHttpRequest = (): HttpRequest =>
  ({
    headers: '',
    method: 'GET',
    params: undefined,
    query: {},
    url: '',
    user: undefined,
  } as unknown as HttpRequest)

describe('Handler suite test cases', () => {
  it('Handler should be validate a 200', () => {
    const res = handler(buildHttpRequest(), mockContext)
    console.log(res)
  })
})

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable extra-rules/no-commented-out-code */

import { isRight } from 'fp-ts/lib/Either';
import { NonEmptyString } from '@pagopa/ts-commons/lib/strings';
import { DecodedContract, onboarding } from '../../utils/messageslack';

const isValidJson = (text: string): boolean => {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};

describe('Handler', () => {
  it('Should decode', () => {
    const rawContract = {
      id: '11111111',
      internalIstitutionID: '11111-11-1-11111',
      product: 'prod-interop-atst',
      state: 'ACTIVE',
      filePath: 'PATH/TO/Adesione.pdf',
      fileName: 'signed_o_adesione.pdf',
      onboardingTokenId: '111111',
      institution: {
        institutionType: 'PA',
        description: 'Comune di xxxxx',
        digitalAddress: 'mail@dom.regione.it',
        address: 'Viale Roma, 1',
        taxCode: '12345678901',
        origin: 'IPA',
        originId: '1_1111',
        zipCode: '00000',
        istatCode: '000000',
        city: 'ROMA',
        country: 'IT',
        county: 'SI',
        category: 'L6',
      },
      billing: {
        vatNumber: '1111111111',
        publicServices: false,
        recipientCode: '123',
      },
      createdAt: '2024-06-25T13:57:14.031Z',
      updatedAt: '2024-06-25T13:57:14.031Z',
      notificationType: 'ADD',
    };

    const res = DecodedContract.decode(rawContract);
    expect(isRight(res)).toBe(true);
  });
  it('Should decode as UPDATE', () => {
    const rawContract = {
      id: '11111111',
      internalIstitutionID: '11111-11-1-11111',
      product: 'prod-interop-atst',
      state: 'ACTIVE',
      filePath: 'PATH/TO/Adesione.pdf',
      fileName: 'signed_o_adesione.pdf',
      onboardingTokenId: '111111',
      institution: {
        institutionType: 'PA',
        description: 'Comune di xxxxx',
        digitalAddress: 'mail@dom.regione.it',
        address: 'Viale Roma, 1',
        taxCode: '12345678901',
        origin: 'IPA',
        originId: '1_1111',
        zipCode: '00000',
        istatCode: '000000',
        city: 'ROMA',
        country: 'IT',
        county: 'SI',
        category: 'L6',
      },
      billing: {
        vatNumber: '1111111111',
        publicServices: false,
        recipientCode: '123',
      },
      createdAt: '2024-06-25T13:57:14.031Z',
      updatedAt: '2024-06-25T14:03:54.031Z',
      notificationType: 'ADD',
    };

    const res = DecodedContract.decode(rawContract);
    expect(isRight(res)).toBe(true);
    if (isRight(res)) {
      const diff = Math.abs(
        (new Date(res.right.updatedAt).getTime() -
          new Date(res.right.createdAt).getTime()) /
          1000 /
          60
      );
      expect(diff).toBeGreaterThan(5);
    }
  });
  it('Should decode a company without TaxCode', () => {
    const rawContract = {
      id: '11111111',
      internalIstitutionID: '11111-11-1-11111',
      product: 'prod-interop-atst',
      state: 'ACTIVE',
      filePath: 'PATH/TO/Adesione.pdf',
      fileName: 'signed_o_adesione.pdf',
      onboardingTokenId: '111111',
      institution: {
        institutionType: 'PA',
        description: 'Comune di xxxxx',
        digitalAddress: 'mail@dom.regione.it',
        address: 'Viale Roma, 1',
        origin: 'IPA',
        originId: '1_1111',
        zipCode: '00000',
        istatCode: '000000',
        city: 'ROMA',
        country: 'IT',
        county: 'SI',
        category: 'L6',
      },
      billing: {
        vatNumber: '1111111111',
        publicServices: false,
        recipientCode: '123',
      },
      createdAt: '2024-06-25T13:57:14.031Z',
      updatedAt: '2024-06-25T13:57:14.031Z',
      notificationType: 'ADD',
    };

    const res = DecodedContract.decode(rawContract);
    expect(isRight(res)).toBe(true);
  });
  it('should produce a slack message if the input is a valid JSON', () => {
    const rawContract = {
      id: '11111111' as NonEmptyString,
      internalIstitutionID: '11111-11-1-11111' as NonEmptyString,
      product: 'prod-interop-atst' as NonEmptyString,
      state: 'ACTIVE' as NonEmptyString,
      filePath: 'PATH/TO/Adesione.pdf' as NonEmptyString,
      fileName: 'signed_o_adesione.pdf' as NonEmptyString,
      onboardingTokenId: '111111',
      rootParent: '' as NonEmptyString,
      institution: {
        institutionType: 'PA' as NonEmptyString,
        description: 'Comune di xxxxx' as NonEmptyString,
        digitalAddress: 'mail@dom.regione.it',
        address: 'Viale Roma, 1' as NonEmptyString,
        origin: 'IPA' as NonEmptyString,
        originId: '1_1111' as NonEmptyString,
        zipCode: '00000' as NonEmptyString,
        istatCode: '000000' as NonEmptyString,
        city: 'ROMA',
        country: 'IT',
        county: 'SI',
        category: 'L6',
      },
      billing: {
        vatNumber: '1111111111' as NonEmptyString,
        publicServices: false,
        recipientCode: '123' as NonEmptyString,
      },
      createdAt: '2024-06-25T13:57:14.031Z' as NonEmptyString,
      updatedAt: '2024-06-25T13:57:14.031Z' as NonEmptyString,
      notificationType: 'ADD' as any,
    };
    const message = onboarding(rawContract);
    expect(isValidJson(JSON.stringify(message))).toBe(true);
    expect(message.attachments[0].fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Tax Code',
          value: 'Non presente',
        }),
      ])
    );
  });
});

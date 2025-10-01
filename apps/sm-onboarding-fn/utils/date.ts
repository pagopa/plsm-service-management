import { DecodedContract } from "./messageslack";

/*
ADD: the difference between updatedAt and createdAt is lesser or equal than 5 minutes
*/
export const isAdd = (contract: DecodedContract): boolean => {
  const diff = Math.abs(
    (new Date(contract.updatedAt).getTime() -
      new Date(contract.createdAt).getTime()) /
      1000 /
      60
  );
  return diff <= 5 ? true : false;
};

export const getCurrentDate = (date: Date): string =>
  `${date.getDate()}/${date.getMonth() +
    1}/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

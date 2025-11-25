export function isNotEmptyObj(obj: Record<string, any>) {
  return Object.keys(obj).length > 0;
}
export function isEmptyObj(obj: Record<string, any>) {
  return Object.keys(obj).length === 0;
}

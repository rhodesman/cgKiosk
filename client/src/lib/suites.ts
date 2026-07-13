export function suiteSelector(id: string | number): string {
  const n = Number(id);
  if (n > 100 && n < 200) return `.suite.o-${id}`;
  return `.suite.s-${id}`;
}

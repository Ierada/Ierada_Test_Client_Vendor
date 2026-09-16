export const lastSevenDays = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 6);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
};

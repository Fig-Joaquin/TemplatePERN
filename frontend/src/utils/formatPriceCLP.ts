export const formatPriceCLP = (price: number) => {
  return `$${Math.trunc(price).toLocaleString("es-CL")}`;
};

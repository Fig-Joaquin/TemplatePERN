// filepath: /home/srtimin/Escritorio/TemplatePERN/backend/src/utils/formatPrice.ts
export const formatPriceCLP = (price: number): string => {
    return price.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};
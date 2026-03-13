export const extractDigits = (value: string): string => value.match(/\d/g)?.join("") ?? "";

export const parseCLP = (value: string): number => {
    const digits = extractDigits(value);
    if (!digits) {
        return 0;
    }

    const parsed = Number.parseInt(digits, 10);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const parseCLPFromUnknown = (value: unknown): number => {
    if (typeof value === "number") {
        if (!Number.isFinite(value)) {
            return 0;
        }
        return Math.trunc(value);
    }

    if (typeof value === "string") {
        return parseCLP(value);
    }

    return 0;
};
export function normalizeLookupValue(value: string): string {
    return value.trim().toLowerCase();
}

export function extractAddressTokens(address: string): string[] {
    const normalized = normalizeLookupValue(address);
    const tokens = new Set<string>();

    if (normalized) {
        tokens.add(normalized);
    }

    for (const segment of normalized.split(',')) {
        const trimmed = segment.trim();
        if (trimmed) {
            tokens.add(trimmed);
        }
    }

    for (const word of normalized.split(/[\s,]+/)) {
        if (word.length >= 3) {
            tokens.add(word);
        }
    }

    return [...tokens];
}

export function addressMatchesSearch(address: string, searchTerm: string): boolean {
    const normalizedAddress = normalizeLookupValue(address);
    const normalizedSearch = normalizeLookupValue(searchTerm);

    if (!normalizedSearch) {
        return false;
    }

    return normalizedAddress.includes(normalizedSearch);
}

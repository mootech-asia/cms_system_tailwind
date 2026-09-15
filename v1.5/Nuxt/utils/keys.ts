export function getLiveGameVendorKey({ vendor, gateway }: { vendor: string, gateway: number}) {
    return `${vendor}_${gateway}`
}
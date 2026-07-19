export function buildPayout(params: {
    totalFare: number;
    commissionRate?: number;
  }) {
    const commissionRate = params.commissionRate ?? 0.2;
    const grossFare = Number(params.totalFare.toFixed(2));
    const platformRevenue = Number((grossFare * commissionRate).toFixed(2));
    const driverPayout = Number((grossFare - platformRevenue).toFixed(2));
  
    return {
      grossFare,
      commissionRate,
      platformRevenue,
      driverPayout,
    };
  }
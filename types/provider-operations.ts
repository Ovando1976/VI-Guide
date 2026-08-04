export type ProviderAvailabilityDay = {
  date: string;
  isOpen: boolean;
  capacity: number;
  startTime: string;
  endTime: string;
  note?: string;
};

export type ProviderOperationsConfig = {
  listingId: string;
  listingName: string;
  timezone: string;
  defaultCapacity: number;
  days: ProviderAvailabilityDay[];
  updatedAt: string;
};

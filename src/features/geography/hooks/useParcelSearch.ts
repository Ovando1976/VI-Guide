import { useMemo, useState } from 'react';
import type { ParcelIslandCode, ParcelRecord } from '../types';
import { searchParcels } from '../lib/parcel-search';

export function useParcelSearch(records: ParcelRecord[], island: ParcelIslandCode | 'all') {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchParcels(records, query, island);
  }, [records, query, island]);

  return {
    query,
    setQuery,
    results,
  };
}

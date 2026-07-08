export function now() {
    return Date.now();
  }
  
  export function withTimestamps<T extends Record<string, any>>(record: T): T {
    return {
      ...record,
      createdAt: record.createdAt ?? now(),
      updatedAt: now(),
    };
  }
  
  export function safeForFirestore(value: any): any {
    if (Array.isArray(value)) {
      return value.map((item) =>
        Array.isArray(item) ? JSON.stringify(item) : safeForFirestore(item)
      );
    }
  
    if (value && typeof value === "object") {
      const output: Record<string, any> = {};
  
      for (const [key, item] of Object.entries(value)) {
        if (item === undefined) continue;
  
        if (key === "geometry") {
          output.geometryJson = JSON.stringify(item);
          continue;
        }
  
        output[key] = safeForFirestore(item);
      }
  
      return output;
    }
  
    return value;
  }
export type TripRiskSeverity = "critical" | "high" | "medium" | "low" | "info";

export type TripRiskCategory =
  | "return_window"
  | "timing"
  | "transfer"
  | "density"
  | "accessibility"
  | "booking"
  | "weather"
  | "trip_data";

export type TripWeatherAlert = {
  id: string;
  event: string;
  headline: string;
  severity: "extreme" | "severe" | "moderate" | "minor" | "unknown";
  onset?: string;
  expires?: string;
  areaDesc?: string;
  instruction?: string;
  sourceUrl?: string;
};

export type TripRiskIssue = {
  id: string;
  severity: TripRiskSeverity;
  category: TripRiskCategory;
  title: string;
  detail: string;
  recommendation: string;
  penalty: number;
  stopIds?: string[];
  sourceUrl?: string;
};

export type TripReturnWindow = {
  arrivalTime?: string;
  allAboardTime: string;
  safeReturnByTime: string;
  latestScheduledEndTime?: string;
  estimatedBufferMinutes?: number;
  requiredBufferMinutes: number;
};

export type TripRiskReport = {
  status: "critical" | "attention" | "watch" | "healthy" | "not_ready" | "past";
  score: number;
  summary: string;
  issueCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  issues: TripRiskIssue[];
  returnWindow?: TripReturnWindow;
};

export type TripRiskOptions = {
  now?: string | Date;
  weatherAlerts?: TripWeatherAlert[];
};

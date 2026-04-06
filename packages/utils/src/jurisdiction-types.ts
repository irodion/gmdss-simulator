export interface ChannelDefinition {
  purpose: string;
  type: "voice" | "dsc_only";
  tx_allowed: boolean;
  max_power?: "low";
}

export interface JurisdictionProfile {
  id: string;
  label: string;
  channel_plan: Record<string, ChannelDefinition>;
  calling_channel: number;
  dsc_channel: number;
  notes: string | null;
}

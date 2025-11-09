export interface BotWithConfig {
  id: number;
  name: string;
  description: string | null;
  configs: Record<string, unknown>;
}

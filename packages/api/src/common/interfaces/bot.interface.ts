export interface BotWithConfig {
  id: number;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
}

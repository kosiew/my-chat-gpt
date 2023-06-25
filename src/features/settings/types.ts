import { ChatGPTModel } from "@src/lib/constants/openai";

export type SettingsState = {
  maxTokens: number;
  preamble: string;
  shiftSend: boolean;
  muteSound: boolean;
  apiKey: string | null;
  showPreamble: boolean;
  model: ChatGPTModel;
};

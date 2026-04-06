import { Type, FunctionDeclaration } from "@google/genai";

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  tools?: {
    googleSearch?: boolean;
    googleMaps?: boolean;
    functionDeclarations?: FunctionDeclaration[];
  };
}

export interface AgentRegistry {
  [id: string]: AgentConfig;
}

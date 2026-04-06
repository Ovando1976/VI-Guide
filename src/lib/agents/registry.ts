import { AgentConfig } from "./types";
import { CONCIERGE_PROMPT, OPERATOR_PROMPT } from "../prompts/agents";
import { Type } from "@google/genai";

export const AGENT_REGISTRY: { [id: string]: AgentConfig } = {
  concierge: {
    id: "concierge",
    name: "Island Concierge",
    description: "Your local expert for the US Virgin Islands.",
    systemInstruction: CONCIERGE_PROMPT,
    tools: {
      googleSearch: true,
      functionDeclarations: [
        {
          name: "searchListings",
          description: "Search for beaches and places (restaurants, bars, excursions, etc.) in the USVI.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "The category to filter by (restaurant, bar, cafe, shopping, attraction, nightlife, excursion, service, provisioning, concierge)."
              },
              query: {
                type: Type.STRING,
                description: "A search term for the name or description."
              },
              islandCode: {
                type: Type.STRING,
                description: "The island code (st_thomas, st_john, st_croix, water_island)."
              }
            }
          }
        },
        {
          name: "searchEvents",
          description: "Search for upcoming local events in the USVI.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: {
                type: Type.STRING,
                description: "A search term for the event title or description."
              },
              islandCode: {
                type: Type.STRING,
                description: "The island code (st_thomas, st_john, st_croix, water_island)."
              }
            }
          }
        },
        {
          name: "getFavorites",
          description: "Get the user's saved favorite places and beaches.",
          parameters: { type: Type.OBJECT, properties: {} }
        },
        {
          name: "getWeather",
          description: "Get the current weather for a specific island in the USVI.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              islandCode: {
                type: Type.STRING,
                description: "The island code (st_thomas, st_john, st_croix, water_island)."
              }
            }
          }
        }
      ]
    }
  },
  operator: {
    id: "operator",
    name: "Operator Assistant",
    description: "Territory-scale intelligence for business and logistics.",
    systemInstruction: OPERATOR_PROMPT,
    tools: {
      googleSearch: true,
      functionDeclarations: [
        {
          name: "getTerritoryStats",
          description: "Get high-level statistics about territory activity and business performance.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              islandCode: {
                type: Type.STRING,
                description: "The island code (st_thomas, st_john, st_croix, water_island)."
              }
            }
          }
        },
        {
          name: "draftDocument",
          description: "Draft an operational report, proposal, or business document.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "The title of the document." },
              content: { type: Type.STRING, description: "The initial content or outline." },
              type: { type: Type.STRING, enum: ["report", "proposal", "memo"], description: "The type of document." }
            },
            required: ["title", "content"]
          }
        }
      ]
    }
  }
};

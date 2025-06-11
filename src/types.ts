// Core type definitions
export interface Repository {
  id: string;
  name: string;
  // Add other properties as needed
}

export interface RequestContext {
  [key: string]: unknown;
}

export interface ErrorContext {
  [key: string]: unknown;
}

export interface EventPayload {
  [key: string]: unknown;
}

declare module 'turndown-plugin-gfm' {
  import TurndownService from 'turndown';
  
  export const tables: (service: TurndownService) => void;
  export const strikethrough: (service: TurndownService) => void;
  export const taskListItems: (service: TurndownService) => void;
  export const gfm: (service: TurndownService) => void;
}
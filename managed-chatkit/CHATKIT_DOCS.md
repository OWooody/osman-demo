# ChatKit Documentation Reference

Quick reference for OpenAI ChatKit documentation and resources.

## Main Documentation Links

### Core Guides
- **Main ChatKit Guide**: https://platform.openai.com/docs/guides/chatkit
- **Custom Theming**: https://platform.openai.com/docs/guides/chatkit-themes
- **Widgets**: https://platform.openai.com/docs/guides/chatkit-widgets
- **Actions**: https://platform.openai.com/docs/guides/chatkit-actions
- **Advanced Integrations**: https://platform.openai.com/docs/guides/custom-chatkit

## API Reference
- **ChatKit JS API Reference**: https://openai.github.io/chatkit-js/
- **React Package**: `@openai/chatkit-react`
- **Core Package**: `@openai/chatkit`

## Key Resources
- **ChatKit Studio/Playground**: Available through platform.openai.com (for customization and code generation)
- **Widget Builder**: For creating custom widgets
- **Sample Code**: GitHub repositories and starter apps

## Common Configuration Patterns

### Basic Setup
```typescript
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import type { ChatKitOptions } from "@openai/chatkit-react";

const options: ChatKitOptions = {
  api: {
    getClientSecret: async (currentSecret) => {
      // Your client secret fetching logic
    },
  },
  // ... other options
};
```

### Theme Configuration
- `colorScheme`: "light" | "dark"
- `radius`: "pill" | "round" | "soft" | "sharp"
- `density`: "compact" | "normal" | "spacious"
- `color.accent.primary`: Hex color string
- `typography`: Font family, size, and sources

### Start Screen Prompts
- `icon`: Valid ChatKitIcon name
- `label`: Display text
- `prompt`: The actual prompt text sent

### Composer Tools
- Custom tools with icons, labels, and actions
- Attachment handling configuration

## Available Icons (ChatKitIcon)
Common icons: `document`, `calendar`, `chart`, `check-circle`, `notebook`, `book-open`, `bolt`, `search`, `settings-slider`, `user`, `write`, and many more.

See full list: https://openai.github.io/chatkit-js/api/openai/chatkit/type-aliases/chatkiticon/

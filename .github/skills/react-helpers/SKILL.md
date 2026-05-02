---
name: React Quick Helpers
description: Use when you need to quickly scaffold React components, hooks, or test UI features
type: skill
---

# React Quick Helpers Skill

Collection of utilities to rapidly scaffold React components, manage common patterns, and test features in the browser.

## Available Commands

### Generate Component

Scaffold a new React functional component with TypeScript and basic structure:

```bash
npm run generate:component -- ComponentName
```

Creates:
- `src/components/ComponentName.tsx` with typed props
- Basic JSX structure and export

### Start Dev Server

Launch the Vite dev server for hot-reload development:

```bash
npm run dev
```

Access at `http://localhost:5173`

### Build for Production

Create optimized production build:

```bash
npm run build
```

### Lint & Type Check

Check for TypeScript errors and linting issues:

```bash
npm run type-check
npm run lint
```

## Common Patterns

### Using Hooks

```typescript
import { useState, useEffect } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log(`Count is now ${count}`);
  }, [count]);
  
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

### Passing Props with TypeScript

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function CustomButton({ label, onClick, disabled = false }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}
```

### Conditional Rendering

```typescript
{isLoading ? <div>Loading...</div> : <Content />}
```

## Testing in Browser

1. Run `npm run dev`
2. Open `http://localhost:5173`
3. Make changes—they auto-reload
4. Check browser console for errors


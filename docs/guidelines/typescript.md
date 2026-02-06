# TypeScript Guidelines

## Core Principles

- `strict: true` in tsconfig (mandatory)
- No `any` - use `unknown` if type is truly unknown
- Explicit return types for public functions
- Use `readonly` for immutable data
- Prefer `Uint8Array` for binary data

## Types vs Interfaces

```typescript
// ✅ Use `type` for data models
type DiagramNode = {
  id: string;
  name: string;
  children: DiagramNode[];
};

// ✅ Use `interface` for contracts and operations
interface Processor {
  process(input: Uint8Array): ProcessResult;
}
```

**Rule of thumb:**

- `type` → Data shapes (DiagramNode, TreeEntry, ModelInfo)
- `interface` → Service contracts, abstract interfaces

## Const Objects over Enums

```typescript
// ✅ Good: Const object + type (better tree-shaking)
const NodeTypes = {
  FOLDER: 'FOLDER',
  DIAGRAM: 'DIAGRAM',
  INFO: 'INFO',
} as const;

type NodeType = (typeof NodeTypes)[keyof typeof NodeTypes];

// ❌ Bad: Enums (poor tree-shaking, runtime overhead)
enum NodeType {
  Folder = 'FOLDER',
}
```

**Why avoid enums?**
- Enums generate extra runtime code
- Poor tree-shaking (entire enum included even if one value used)
- Const objects are just plain objects - zero overhead

## Naming Conventions

| Type          | Convention            | Example                          |
| ------------- | --------------------- | -------------------------------- |
| Variables     | camelCase             | `nodeList`, `isLoading`          |
| Constants     | SCREAMING_SNAKE_CASE  | `MAX_DEPTH`, `DEFAULT_LANG`      |
| Functions     | camelCase             | `parseTree`, `processSvg`        |
| Types         | PascalCase            | `DiagramNode`, `ModelInfo`       |
| Interfaces    | PascalCase            | `Processor`, `Parser`            |
| Const Objects | PascalCase + plural   | `NodeTypes`, `Languages`         |
| Classes       | PascalCase            | `TreeParser`, `SvgProcessor`     |

## File Naming

| Type             | Convention             | Example               |
| ---------------- | ---------------------- | --------------------- |
| Types/Interfaces | lowercase              | `types.ts`            |
| Classes          | lowercase              | `tree-parser.ts`      |
| Utilities        | camelCase              | `decompress.ts`       |
| Tests            | Same name + `.spec.ts` | `tree-parser.spec.ts` |

## Common Patterns

### Discriminated Unions

```typescript
type ProcessResult<T> = 
  | { success: true; value: T } 
  | { success: false; error: string };
```

### Snapshot Pattern (for debugging)

```typescript
class TreeParser {
  snapshot(): TreeSnapshot {
    return {
      nodes: [...this.nodes],
      depth: this.depth,
    };
  }
}
```

## Anti-patterns

```typescript
// ❌ Using `any`
function process(data: any): any {}

// ❌ Using enums
enum NodeType { Folder = 'FOLDER' }

// ❌ Type assertions without validation
const node = response as DiagramNode;

// ❌ Non-null assertions without checks
const name = node!.name;

// ❌ Implicit any in function params
function process(data) {}

// ❌ Magic strings without constants
if (node.type === 'FOLDER') {}

// ✅ Better:
if (node.type === NodeTypes.FOLDER) {}
```

## Binary Data

```typescript
// ✅ Use Uint8Array for binary buffers
function decompress(buffer: Uint8Array): Uint8Array {
  // zlib decompression for SVGZ
}

// ✅ Use DataView for multi-byte reads
const view = new DataView(buffer.buffer, buffer.byteOffset);
const value = view.getUint32(offset, true); // little-endian
```

## Error Handling

```typescript
// ✅ Use typed errors
class ProcessError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ProcessError';
  }
}

throw new ProcessError('INVALID_SVG', 'SVG parsing failed');

// ✅ Check error type
if (error instanceof ProcessError) {
  console.error(`Process error: ${error.code}`);
}
```

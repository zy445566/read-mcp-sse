# read-mcp-sse

A tool for reading MCP (Message Control Protocol) server through SSE (Server-Sent Events) URL. This library allows you to:

1. Connect to an MCP server via SSE
2. Retrieve a list of available MCP methods
3. Call MCP methods with parameters
4. Receive real-time updates through the SSE connection

## Installation

```bash
npm install read-mcp-sse
```

## Usage

### Basic Example

```typescript
import { McpSseReader } from 'read-mcp-sse';

// Create an instance with your MCP SSE URL
const mcpReader = new McpSseReader('http://your-mcp-server/sse');

// Get available methods
mcpReader.getMethods()
  .then(methods => {
    console.log('Available methods:', methods);
    
    // Call a method
    return mcpReader.callMethod('methodName', { param1: 'value1' });
  })
  .then(result => {
    console.log('Method call result:', result);
  })
  .catch(error => {
    console.error('Error:', error);
  })
  .finally(() => {
    // Close the connection when done
    mcpReader.close();
  });
```

### Advanced Example

See the [example.ts](./src/test.ts) file for a more detailed example.

## API

### `McpSseReader`

#### Constructor

```typescript
constructor(mcpProxySseUrl: string)
```

- `mcpProxySseUrl`: The SSE URL of the MCP server

#### Methods

- `waitForConnection()`: Returns a Promise that resolves when the connection is established
- `getMethods()`: Returns a Promise with the list of available MCP methods
- `callMethod(methodName: string, params: any = {})`: Calls an MCP method with the provided parameters
- `close()`: Closes the SSE connection

## License

MIT

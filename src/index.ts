
import {EventSource} from 'eventsource'
import fetch from 'node-fetch';

interface MCPMethod {
    name: string;
    description?: string;
    inputSchema?: {
      title: string;
      description?: string;
      type: string;
      properties?: any;
    };
    required?: string[];
}

export class McpSseReader {
    private eventSource: EventSource;
    private endpointURL: string;
    private mcpProxySseUrl: string;
    private sendId: number = 0;
    private responseIdMap: Map<number, (value: any) => void> = new Map();
    public timeout: number = 30000;
    private isConnected: boolean = false;
    private connectionPromise: Promise<void>;
    private connectionResolve!: () => void;
    public clientInfo = {
        "name": "McpSseReader",
        "version": "1.0.0"
    }
    public serverInfo = {
        "name": "",
        "version": "1.0.0"
    }
    
    constructor(mcpProxySseUrl: string) {
        this.mcpProxySseUrl = mcpProxySseUrl;
        this.eventSource = new EventSource(this.mcpProxySseUrl);
        
        this.connectionPromise = new Promise<void>((resolve) => {
            this.connectionResolve = resolve;
        });
        
        this.setupEventListeners();
    }

    async sendMessage(body: any,isReply: boolean=false): Promise<any> {
        if(!isReply) {
          body.id = this.sendId;
          this.sendId++;
        }
        await fetch(this.endpointURL,{
          method: 'post',
          body: JSON.stringify(body),
          headers: {'Content-Type': 'application/json'}
        })
        if(isReply) {
          return;
        }
        return await new Promise<any>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.responseIdMap.delete(body.id);
                return reject(new Error('Request timed out'));
            }, this.timeout);
            this.responseIdMap.set(body.id, (data)=>{
              resolve(data);
              clearTimeout(timer);
            });
        });
    }


    private async initialize() {
      const data = await this.sendMessage({
          "method": "initialize",
          "params": {
              "protocolVersion": "2025-03-26",
              "capabilities": {
                  "sampling": {},
                  "roots": {
                      "listChanged": true
                  }
              },
              "clientInfo": this.clientInfo
          },
          "jsonrpc": "2.0"
      })
      await this.sendMessage({
          "method": "notifications/initialized",
          "jsonrpc": "2.0"
      },true)
      this.serverInfo = data.result.serverInfo;
      this.isConnected = true;
      this.connectionResolve();
    }
    
    
    private setupEventListeners(): void {
        this.eventSource.addEventListener("open", () => {
          console.log('Connection to MCP SSE established');
          
        });
        this.eventSource.addEventListener("error", (error) => {
          console.error('Error connecting to MCP SSE:', error);
            this.isConnected = false;
        });
        this.eventSource.addEventListener("endpoint", (event) => {
          this.endpointURL = new URL(event.data,this.mcpProxySseUrl).href;
          console.log('endpointURL',this.endpointURL)
          this.initialize()
        });
        this.eventSource.addEventListener("message",  (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Received SSE message:', data);
                if(this.responseIdMap.has(data.id)) {
                    this.responseIdMap.get(data.id)(data);
                    this.responseIdMap.delete(data.id);
                }
            } catch (error) {
                console.error('Error parsing SSE message:', error);
            }
        });
    }
    
    /**
     * Waits for the connection to be established
     */
    public async waitForConnection(): Promise<void> {
        if (this.isConnected) return Promise.resolve();
        return this.connectionPromise;
    }
    
    /**
     * Fetches the list of available MCP methods
     */
    public async getMethods(): Promise<{tools:MCPMethod[]}> {
        await this.waitForConnection();
        const data = await this.sendMessage({
            "method": "tools/list",
            "params": {
                "_meta": {
                    "progressToken": 1
                }
            },
            "jsonrpc": "2.0"
        })
        return data.result;
    }
    
    /**
     * Calls an MCP method with the provided parameters
     * @param methodName The name of the method to call
     * @param params Parameters to pass to the method
     */
    public async callMethod(methodName: string, params: any = {}): Promise<{content:any}> {
        await this.waitForConnection();
        const data = await this.sendMessage({
          "method": "tools/call",
          "params": {
              "name": methodName,
              "arguments": params,
              "_meta": {
                  "progressToken": 1
              }
          },
          "jsonrpc": "2.0",
        })
        return data.result;
        
    }
    
    /**
     * Closes the SSE connection
     */
    public close(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.isConnected = false;
            console.log('MCP SSE connection closed');
        }
    }
}
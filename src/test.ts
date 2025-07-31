import { McpSseReader } from './index';

async function main() {
    // 创建MCP SSE读取器实例
    const mcpSseUrl = 'http://127.0.0.1:8881/sse';
    const mcpReader = new McpSseReader(mcpSseUrl);
    
    try {
        // 等待连接建立
        console.log('Connecting to MCP server...');
        await mcpReader.waitForConnection();
        
        // 获取可用的MCP方法列表
        console.log('Fetching available MCP methods...');
        const methodsResp = await mcpReader.getMethods();
        const methods = methodsResp.tools;
        console.log('Available methods:', methods);
        
        // 调用一个MCP方法示例
        if (methods.length > 0) {
            const methodToCall = methods[0].name;
            console.log(`Calling method: ${methodToCall}`);
            const result = await mcpReader.callMethod(methodToCall, {
                // 这里填入方法所需的参数
                // param1: 'value1',
                // param2: 'value2',
            });
            console.log('Method call result:', result);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        // 关闭连接
        mcpReader.close();
    }
}

main().catch(console.error);
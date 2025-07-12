// MCP API endpoint for web platform
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { server_name, tool_name, args } = body;

    // For now, return null to indicate MCP is not available in web
    // This will cause the app to fallback to mock data
    console.log(`MCP call attempted: ${server_name} -> ${tool_name}`, args);
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'MCP not available in web environment',
      data: null 
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('MCP API error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Handle other HTTP methods
export async function GET() {
  return new Response(JSON.stringify({ 
    message: 'MCP API endpoint - POST requests only' 
  }), { 
    status: 405,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
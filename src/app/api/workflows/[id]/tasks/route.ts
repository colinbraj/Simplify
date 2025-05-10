import { NextRequest, NextResponse } from 'next/server';

// POST /api/workflows/[id]/tasks - Create a new task for a specific workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const body = await request.json();
    
    // In a real app, you would validate the request body and save to a database
    // For now, we'll just return the task data with a generated ID
    const newTask = {
      ...body,
      id: crypto.randomUUID(),
      workflowId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeEntries: []
    };
    
    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

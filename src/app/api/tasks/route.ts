import { NextRequest, NextResponse } from 'next/server';

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In a real app, you would validate the request body and save to a database
    // For now, we'll just return the task data with a generated ID
    const newTask = {
      ...body,
      id: crypto.randomUUID(),
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

// PUT /api/tasks/:id - Update a task
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // In a real app, you would update the task in a database
    // For now, we'll just return the updated task data
    const updatedTask = {
      ...body,
      id: taskId,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

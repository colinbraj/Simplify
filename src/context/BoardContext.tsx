'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define types
export type Status = 'todo' | 'in_progress' | 'done' | 'stuck';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Task = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  assignees: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type Group = {
  id: string;
  title: string;
  tasks: Task[];
};

export type Board = {
  id: string;
  title: string;
  description: string;
  groups: Group[];
  createdAt: string;
  updatedAt: string;
};

// Mock data
const initialBoards: Board[] = [
  {
    id: '1',
    title: 'Active Workflows',
    description: 'Currently active workflow tasks',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    groups: [
      {
        id: 'g1',
        title: 'Applications',
        tasks: [
          {
            id: 't1',
            title: 'Review candidate resume',
            description: 'Review application materials for frontend developer position',
            status: 'in_progress',
            priority: 'high',
            dueDate: '2025-05-12',
            assignees: ['user1'],
            tags: ['hiring'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ],
      },
      {
        id: 'g2',
        title: 'Interviews',
        tasks: [
          {
            id: 't2',
            title: 'Schedule technical interview',
            description: 'Coordinate with the engineering team for technical assessment',
            status: 'todo',
            priority: 'medium',
            dueDate: '2025-05-15',
            assignees: ['user1'],
            tags: ['interview'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ],
      },
      {
        id: 'g3',
        title: 'Offers',
        tasks: [],
      }
    ],
  }
];

// Create context
type BoardContextType = {
  boards: Board[];
  currentBoard: Board | null;
  setCurrentBoard: (board: Board) => void;
  addBoard: (board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBoard: (boardId: string, updates: Partial<Board>) => void;
  deleteBoard: (boardId: string) => void;
  addGroup: (boardId: string, group: Omit<Group, 'id'>) => void;
  updateGroup: (boardId: string, groupId: string, updates: Partial<Group>) => void;
  deleteGroup: (boardId: string, groupId: string) => void;
  addTask: (boardId: string, groupId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (boardId: string, groupId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (boardId: string, groupId: string, taskId: string) => void;
  moveTask: (
    sourceBoardId: string,
    sourceGroupId: string,
    taskId: string,
    destinationBoardId: string,
    destinationGroupId: string
  ) => void;
};

const BoardContext = createContext<BoardContextType | undefined>(undefined);

// Provider component
export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(initialBoards[0] || null);

  // Generate a unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Add a new board
  const addBoard = (board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBoard: Board = {
      ...board,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBoards([...boards, newBoard]);
  };

  // Update a board
  const updateBoard = (boardId: string, updates: Partial<Board>) => {
    setBoards(
      boards.map((board) =>
        board.id === boardId
          ? { ...board, ...updates, updatedAt: new Date().toISOString() }
          : board
      )
    );
    
    // Update current board if it's the one being modified
    if (currentBoard && currentBoard.id === boardId) {
      setCurrentBoard({ ...currentBoard, ...updates, updatedAt: new Date().toISOString() });
    }
  };

  // Delete a board
  const deleteBoard = (boardId: string) => {
    setBoards(boards.filter((board) => board.id !== boardId));
    
    // Reset current board if it's the one being deleted
    if (currentBoard && currentBoard.id === boardId) {
      setCurrentBoard(boards.find((board) => board.id !== boardId) || null);
    }
  };

  // Add a new group to a board
  const addGroup = (boardId: string, group: Omit<Group, 'id'>) => {
    const newGroup: Group = {
      ...group,
      id: generateId(),
    };
    
    setBoards(
      boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              groups: [...board.groups, newGroup],
              updatedAt: new Date().toISOString(),
            }
          : board
      )
    );
    
    // Update current board if it's the one being modified
    if (currentBoard && currentBoard.id === boardId) {
      setCurrentBoard({
        ...currentBoard,
        groups: [...currentBoard.groups, newGroup],
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Update a group
  const updateGroup = (boardId: string, groupId: string, updates: Partial<Group>) => {
    setBoards(
      boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              groups: board.groups.map((group) =>
                group.id === groupId ? { ...group, ...updates } : group
              ),
              updatedAt: new Date().toISOString(),
            }
          : board
      )
    );
    
    // Update current board if it's the one being modified
    if (currentBoard && currentBoard.id === boardId) {
      setCurrentBoard({
        ...currentBoard,
        groups: currentBoard.groups.map((group) =>
          group.id === groupId ? { ...group, ...updates } : group
        ),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Delete a group
  const deleteGroup = (boardId: string, groupId: string) => {
    setBoards(
      boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              groups: board.groups.filter((group) => group.id !== groupId),
              updatedAt: new Date().toISOString(),
            }
          : board
      )
    );
    
    // Update current board if it's the one being modified
    if (currentBoard && currentBoard.id === boardId) {
      setCurrentBoard({
        ...currentBoard,
        groups: currentBoard.groups.filter((group) => group.id !== groupId),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Add a new task to a group
  const addTask = (
    boardId: string,
    groupId: string,
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setBoards(
      boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              groups: board.groups.map((group) =>
                group.id === groupId
                  ? { ...group, tasks: [...group.tasks, newTask] }
                  : group
              ),
              updatedAt: new Date().toISOString(),
            }
          : board
      )
    );
    
    // Update current board if it's the one being modified
    if (currentBoard && currentBoard.id === boardId) {
      setCurrentBoard({
        ...currentBoard,
        groups: currentBoard.groups.map((group) =>
          group.id === groupId
            ? { ...group, tasks: [...group.tasks, newTask] }
            : group
        ),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Update a task
  const updateTask = (
    boardId: string,
    groupId: string,
    taskId: string,
    updates: Partial<Task>
  ) => {
    setBoards(
      boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              groups: board.groups.map((group) =>
                group.id === groupId
                  ? {
                      ...group,
                      tasks: group.tasks.map((task) =>
                        task.id === taskId
                          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
                          : task
                      ),
                    }
                  : group
              ),
              updatedAt: new Date().toISOString(),
            }
          : board
      )
    );
    
    // Update current board if it's the one being modified
    if (currentBoard && currentBoard.id === boardId) {
      setCurrentBoard({
        ...currentBoard,
        groups: currentBoard.groups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                tasks: group.tasks.map((task) =>
                  task.id === taskId
                    ? { ...task, ...updates, updatedAt: new Date().toISOString() }
                    : task
                ),
              }
            : group
        ),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Delete a task
  const deleteTask = (boardId: string, groupId: string, taskId: string) => {
    setBoards(
      boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              groups: board.groups.map((group) =>
                group.id === groupId
                  ? {
                      ...group,
                      tasks: group.tasks.filter((task) => task.id !== taskId),
                    }
                  : group
              ),
              updatedAt: new Date().toISOString(),
            }
          : board
      )
    );
    
    // Update current board if it's the one being modified
    if (currentBoard && currentBoard.id === boardId) {
      setCurrentBoard({
        ...currentBoard,
        groups: currentBoard.groups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                tasks: group.tasks.filter((task) => task.id !== taskId),
              }
            : group
        ),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Move a task between groups or boards
  const moveTask = (
    sourceBoardId: string,
    sourceGroupId: string,
    taskId: string,
    destinationBoardId: string,
    destinationGroupId: string
  ) => {
    // Find the task to move
    const sourceBoard = boards.find((board) => board.id === sourceBoardId);
    if (!sourceBoard) return;
    
    const sourceGroup = sourceBoard.groups.find((group) => group.id === sourceGroupId);
    if (!sourceGroup) return;
    
    const taskToMove = sourceGroup.tasks.find((task) => task.id === taskId);
    if (!taskToMove) return;
    
    // Remove the task from the source
    const updatedBoards = boards.map((board) =>
      board.id === sourceBoardId
        ? {
            ...board,
            groups: board.groups.map((group) =>
              group.id === sourceGroupId
                ? {
                    ...group,
                    tasks: group.tasks.filter((task) => task.id !== taskId),
                  }
                : group
            ),
            updatedAt: new Date().toISOString(),
          }
        : board
    );
    
    // Add the task to the destination
    const finalBoards = updatedBoards.map((board) =>
      board.id === destinationBoardId
        ? {
            ...board,
            groups: board.groups.map((group) =>
              group.id === destinationGroupId
                ? {
                    ...group,
                    tasks: [...group.tasks, { ...taskToMove, updatedAt: new Date().toISOString() }],
                  }
                : group
            ),
            updatedAt: new Date().toISOString(),
          }
        : board
    );
    
    setBoards(finalBoards);
    
    // Update current board if it's involved in the move
    if (currentBoard && (currentBoard.id === sourceBoardId || currentBoard.id === destinationBoardId)) {
      const updatedBoard = finalBoards.find((board) => board.id === currentBoard.id);
      if (updatedBoard) {
        setCurrentBoard(updatedBoard);
      }
    }
  };

  return (
    <BoardContext.Provider
      value={{
        boards,
        currentBoard,
        setCurrentBoard,
        addBoard,
        updateBoard,
        deleteBoard,
        addGroup,
        updateGroup,
        deleteGroup,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

// Custom hook to use the board context
export function useBoard() {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
}

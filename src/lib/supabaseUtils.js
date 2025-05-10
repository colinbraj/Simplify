import { supabase } from './supabase';

// Workflow functions
export const getWorkflows = async () => {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching workflows:', error);
    return [];
  }
  
  return data || [];
};

export const getWorkflowById = async (id) => {
  const { data, error } = await supabase
    .from('workflows')
    .select('*, tasks(*)')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching workflow with id ${id}:`, error);
    return null;
  }
  
  return data;
};

export const createWorkflow = async (workflow) => {
  const { data, error } = await supabase
    .from('workflows')
    .insert([workflow])
    .select();
  
  if (error) {
    console.error('Error creating workflow:', error);
    return null;
  }
  
  return data[0];
};

export const updateWorkflow = async (id, updates) => {
  const { data, error } = await supabase
    .from('workflows')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error(`Error updating workflow with id ${id}:`, error);
    return null;
  }
  
  return data[0];
};

export const deleteWorkflow = async (id) => {
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting workflow with id ${id}:`, error);
    return false;
  }
  
  return true;
};

// Task functions
export const getTasks = async (workflowId) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error(`Error fetching tasks for workflow ${workflowId}:`, error);
    return [];
  }
  
  return data || [];
};

export const createTask = async (task) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select();
  
  if (error) {
    console.error('Error creating task:', error);
    return null;
  }
  
  return data[0];
};

export const updateTask = async (id, updates) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error(`Error updating task with id ${id}:`, error);
    return null;
  }
  
  return data[0];
};

export const deleteTask = async (id) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting task with id ${id}:`, error);
    return false;
  }
  
  return true;
};

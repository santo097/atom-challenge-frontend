/**
 * Representa una tarea del usuario tal como la devuelve el backend.
 */
export interface Task {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string;
  readonly completed: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * DTO para crear una tarea nueva.
 * El `userId` lo infiere el backend desde el JWT, no se envía.
 */
export interface CreateTaskDto {
  readonly title: string;
  readonly description?: string;
}

/**
 * DTO para actualizar una tarea existente.
 * Todos los campos son opcionales — el backend aplica solo los enviados.
 */
export interface UpdateTaskDto {
  readonly title?: string;
  readonly description?: string;
  readonly completed?: boolean;
}

/**
 * Valores posibles del filtro de tareas en la UI.
 */
export type TaskFilter = 'all' | 'pending' | 'completed';

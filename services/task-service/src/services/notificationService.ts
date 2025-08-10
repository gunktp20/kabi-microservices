import HttpClient from './httpClient';
import { NOTIFICATION_SERVICE_URL } from '../config/application.config';

class NotificationService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient(NOTIFICATION_SERVICE_URL);
  }

  async createAssignment(assignmentData: {
    assignee_id: string;
    sender_id: string;
    task_id: string;
    board_id: string;
  }, authorization?: string) {
    try {
      const response = await this.httpClient.post(
        `/api/assignments`,
        assignmentData,
        {
          headers: {
            Authorization: authorization || '',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteAssignmentsByTaskId(taskId: string, authorization?: string) {
    try {
      const response = await this.httpClient.delete(
        `/api/assignments/task/${taskId}`,
        {
          headers: {
            Authorization: authorization || '',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getAssignmentByTaskAndUser(taskId: string, assigneeId: string, authorization?: string) {
    try {
      const response = await this.httpClient.get(
        `/api/assignments/task/${taskId}/user/${assigneeId}`,
        {
          headers: {
            Authorization: authorization || '',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async deleteAssignment(assignmentId: string, authorization?: string) {
    try {
      const response = await this.httpClient.delete(
        `/api/assignments/${assignmentId}`,
        {
          headers: {
            Authorization: authorization || '',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new NotificationService();
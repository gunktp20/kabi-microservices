import HttpClient from './httpClient';
import { TASK_SERVICE_URL } from '../config/application.config';

class TaskService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient(TASK_SERVICE_URL);
  }

  async getTaskById(taskId: string, authorization?: string) {
    try {
      const response = await this.httpClient.get(
        `/api/tasks/${taskId}`,
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

export default new TaskService();
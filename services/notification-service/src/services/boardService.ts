import HttpClient from './httpClient';
import { BOARD_SERVICE_URL } from '../config/application.config';

class BoardService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient(BOARD_SERVICE_URL);
  }

  async checkBoardMembership(boardId: string, userId: string, authorization?: string) {
    try {
      const response = await this.httpClient.get(
        `/api/boards/${boardId}/members/${userId}`,
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

  async getBoardMembers(boardId: string, authorization?: string) {
    try {
      const response = await this.httpClient.get(
        `/api/boards/${boardId}/members`,
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

  async getBoardById(boardId: string, authorization?: string) {
    try {
      const response = await this.httpClient.get(
        `/api/boards/${boardId}`,
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

  async addBoardMember(boardId: string, memberData: any, authorization?: string) {
    try {
      const response = await this.httpClient.post(
        `/api/boards/${boardId}/members`,
        memberData,
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

export default new BoardService();
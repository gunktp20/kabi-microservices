import HttpClient from './httpClient';
import { NOTIFICATION_SERVICE_URL } from '../config/application.config';

class NotificationService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient(NOTIFICATION_SERVICE_URL);
  }

  async createBulkBoardInvitations(
    boardId: string,
    invitedMembers: Array<{
      id: string;
      displayName: string;
      email: string;
    }>,
    authorization?: string
  ) {

    console.log("==============================================================================")
    console.log(authorization)
    console.log("==============================================================================")
    try {
      const response = await this.httpClient.post(
        `/api/invitations/${boardId}/bulk`,
        { invitedMembers },
        {
          headers: {
            Authorization: authorization || '',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create bulk board invitations:', error);
      throw error;
    }
  }

  async createBoardInvitation(
    boardId: string,
    recipientId: string,
    authorization?: string
  ) {
    try {
      const response = await this.httpClient.post(
        `/api/invitations/${boardId}`,
        { recipient_id: recipientId },
        {
          headers: {
            Authorization: authorization || '',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create board invitation:', error);
      throw error;
    }
  }
}

export default new NotificationService();
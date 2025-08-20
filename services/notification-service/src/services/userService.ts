import HttpClient from "./httpClient";
import { USER_SERVICE_URL } from "../config/application.config";

class UserService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient(USER_SERVICE_URL);
  }

  async getUserByEmail(email: string, authorization?: string) {
    try {
      const response = await this.httpClient.get(
        `/api/users/by-email/${email}`,
        {
          headers: {
            Authorization: authorization || "",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId: string, authorization?: string) {
    try {
      const response = await this.httpClient.post(
        `/api/users/check-exists`,
        {
          user_id: userId,
        },
        {
          headers: {
            Authorization: authorization || "",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();

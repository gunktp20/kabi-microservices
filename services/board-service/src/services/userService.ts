import HttpClient from "./httpClient";

const httpClient = new HttpClient();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface UserServiceResponse {
  success: boolean;
  data: User[];
}

const getUsersByIds = async (userIds: string[], authToken?: string): Promise<User[]> => {
  if (!userIds || userIds.length === 0) {
    return [];
  }
  try {
    const response = await httpClient.post(
      `${USER_SERVICE_URL}/users/batch`,
      { userIds },
      {
        headers: {
          Authorization: authToken,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data as UserServiceResponse;
    return result.data || [];
  } catch (error) {
    console.error('Error fetching users from user-service:', error);
    // Fallback: return basic user objects with just user_id
    return userIds.map(id => ({
      id,
      email: '',
      displayName: `User ${id}`
    }));
  }
};

const getUserById = async (userId: string, authToken?: string): Promise<User | null> => {
  try {
    const response = await httpClient.get(
      `${USER_SERVICE_URL}/users/${userId}`,
      {
        headers: {
          Authorization: authToken,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data;
    return result.data || null;
  } catch (error) {
    console.error(`Error fetching user ${userId} from user-service:`, error);
    return null;
  }
};

export {
  getUsersByIds,
  getUserById
};
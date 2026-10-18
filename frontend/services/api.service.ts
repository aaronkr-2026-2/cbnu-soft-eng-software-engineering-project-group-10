import axios from 'axios';

const API_URL = 'http://localhost:3001';

export interface Task {
    id: number;
    title: string;
    isCompleted: boolean;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    user?: {
        id: number;
        nickname: string;
    };
}

export const fetchTasks = async (): Promise<Task[]> => {
    const response = await axios.get(`${API_URL}/tasks`);
    return response.data;
};

export const login = async (
    nickname: string,
    password: string,
): Promise<LoginResponse> => {
    const response = await axios.post(`${API_URL}/auth/login`, {
        nickname,
        password,
    });

    return response.data;
};
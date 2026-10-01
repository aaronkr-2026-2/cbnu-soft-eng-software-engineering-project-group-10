import { Injectable } from '@nestjs/common';

export interface Task {
    id: number;
    title: string;
    isCompleted: boolean;
}

@Injectable()
export class TasksService {
    private tasks: Task[] = [
        {
            id: 1,
            title: 'Write NestJS Article',
            isCompleted: false,
        },
        {
            id: 2,
            title: 'Deploy Backend API',
            isCompleted: true,
        },
    ];

    findAll(): Task[] {
        return this.tasks;
    }
}
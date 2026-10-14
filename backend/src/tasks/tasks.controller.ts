import { Controller, Get } from '@nestjs/common';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Get()
    findAll() {
        return this.tasksService.findAll();
    }
}
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    private users = [
        {
            id: 1,
            nickname: 'admin',
            password: '123456',
        },
    ];

    login(nickname: string, password: string) {
        const user = this.users.find(
            (user) =>
                user.nickname === nickname &&
                user.password === password,
        );

        if (!user) {
            return {
                success: false,
                message: 'Invalid nickname or password',
            };
        }

        return {
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                nickname: user.nickname,
            },
        };
    }
}
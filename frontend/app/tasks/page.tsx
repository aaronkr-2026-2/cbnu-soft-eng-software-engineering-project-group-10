'use client';

import { useState } from 'react';
import { fetchTasks, login, Task } from '../../services/api.service';

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);

    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [message, setMessage] = useState('');

    const handleSignIn = async () => {
        try {
            // 1. Send nickname/password to NestJS
            const result = await login(nickname, password);

            // 2. Handle incorrect credentials
            if (!result.success) {
                setMessage(result.message);
                return;
            }

            // 3. Handle successful login
            setIsLoggedIn(true);
            setMessage(`Welcome ${result.user?.nickname}`);

            // 4. Fetch tasks from the backend
            const taskData = await fetchTasks();
            setTasks(taskData);

        } catch (error) {
            console.error(error);
            setMessage('Cannot connect to backend');
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-24">

            {!isLoggedIn ? (
                <>
                    <h1 className="text-4xl font-bold mb-8">
                        Login
                    </h1>

                    <div className="w-full max-w-md p-6 bg-gray-800 rounded">

                        <div className="mb-4">
                            <label className="block mb-2">
                                Nickname
                            </label>

                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full p-2 text-black rounded"
                                placeholder="Enter nickname"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block mb-2">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 text-black rounded"
                                placeholder="Enter password"
                            />
                        </div>

                        <button
                            onClick={handleSignIn}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded"
                        >
                            Sign in
                        </button>

                        {message && (
                            <p className="mt-4 text-center">
                                {message}
                            </p>
                        )}

                    </div>
                </>
            ) : (
                <>
                    <h1 className="text-4xl font-bold mb-4">
                        Tasks
                    </h1>

                    <p className="mb-8">
                        {message}
                    </p>

                    <div className="w-full max-w-md">

                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-4 bg-gray-800 rounded mb-2"
                            >
                                <span>
                                    {task.title}
                                </span>

                                <span
                                    className={`px-2 py-1 rounded ${task.isCompleted
                                            ? 'bg-green-500 text-black'
                                            : 'bg-yellow-500 text-black'
                                        }`}
                                >
                                    {task.isCompleted ? 'Done' : 'Pending'}
                                </span>
                            </div>
                        ))}

                    </div>
                </>
            )}

        </main>
    );
}
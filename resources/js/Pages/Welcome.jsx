import { Link, Head } from '@inertiajs/react';

export default function Welcome({ auth, laravelVersion, phpVersion, canLogin, canRegister }) {
    return (
        <>
            <Head title="Welcome" />
            <div className="relative sm:flex sm:justify-center sm:items-center min-h-screen bg-dots-darker bg-center bg-gray-100 dark:bg-dots-lighter dark:bg-gray-900 selection:bg-red-500 selection:text-white">
                <div className="sm:fixed sm:top-0 sm:right-0 p-6 text-end">
                    {auth?.user ? (
                        <Link
                            href={route('dashboard')}
                            className="font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline focus:outline-2 focus:rounded-sm focus:outline-red-500"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            {canLogin && (
                                <Link
                                    href={route('login')}
                                    className="font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline focus:outline-2 focus:rounded-sm focus:outline-red-500"
                                >
                                    Log in
                                </Link>
                            )}

                            {canRegister && (
                                <Link
                                    href={route('register')}
                                    className="ms-4 font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline focus:outline-2 focus:rounded-sm focus:outline-red-500"
                                >
                                    Register
                                </Link>
                            )}
                        </>
                    )}
                </div>

                <div className="max-w-7xl mx-auto p-6 lg:p-8">
                    <div className="flex justify-center mb-10">
                        <img src="/logo.svg" className="w-32 h-auto" alt="App Logo" />
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        <a
                            href="https://laravel.com/docs"
                            className="p-6 bg-white dark:bg-gray-800/50 rounded-lg shadow-md hover:shadow-lg transition"
                        >
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Documentation</h2>
                            <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                Laravel has excellent documentation. Learn about routing, controllers, migrations,
                                testing, and more.
                            </p>
                        </a>

                        <a
                            href="https://laracasts.com"
                            className="p-6 bg-white dark:bg-gray-800/50 rounded-lg shadow-md hover:shadow-lg transition"
                        >
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Laracasts</h2>
                            <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                Thousands of Laravel & PHP tutorials to improve your skills and build professional apps.
                            </p>
                        </a>
                    </div>

                    <div className="flex justify-between items-center mt-16 text-sm text-gray-500 dark:text-gray-400">
                        <div>Laravel v{laravelVersion} (PHP v{phpVersion})</div>
                        <div>Built with ❤️ and Inertia.js + React</div>
                    </div>
                </div>
            </div>

            <style>{`
                .bg-dots-darker {
                    background-image: url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.5 0C2.3 0 3 0.7 3 1.5C3 2.3 2.3 3 1.5 3C0.7 3 0 2.3 0 1.5C0 0.7 0.7 0 1.5 0Z' fill='rgba(0,0,0,0.06)'/%3E%3C/svg%3E");
                }
                @media (prefers-color-scheme: dark) {
                    .dark\\:bg-dots-lighter {
                        background-image: url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.5 0C2.3 0 3 0.7 3 1.5C3 2.3 2.3 3 1.5 3C0.7 3 0 2.3 0 1.5C0 0.7 0.7 0 1.5 0Z' fill='rgba(255,255,255,0.06)'/%3E%3C/svg%3E");
                    }
                }
            `}</style>
        </>
    );
}

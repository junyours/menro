import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            {/* Fullscreen Layout */}
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-50 via-gray-100 to-gray-200 px-4 sm:px-6 py-10">
                <div className="relative w-full max-w-md bg-white/95 rounded-[30px_10px_30px_10px] shadow-[0_0_40px_rgba(0,0,0,0.12)] border border-gray-200 px-6 sm:px-8 py-8 sm:py-10 overflow-hidden">

                    {/* Accent background */}
                    <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />

                    {/* Header */}
                    <div className="relative text-center mb-8 sm:mb-10">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 shadow-sm">
                            <span className="text-indigo-600 text-2xl font-bold">?</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Forgot your password?
                        </h1>
                        <p className="mt-3 text-sm sm:text-base text-gray-600">
                            No worries. Enter your email and we’ll send you a secure reset link.
                        </p>
                    </div>

                    {/* Status */}
                    {status && (
                        <div className="relative mb-6 rounded-lg border border-green-300 bg-green-50/90 p-4 text-sm font-medium text-green-700 shadow-sm">
                            {status}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={submit} className="relative space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                                Email Address
                            </label>
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="block w-full rounded-xl border-gray-300 bg-gray-50 px-4 py-3 text-base shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-0 transition-all"
                                placeholder="your@gmail.com"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2 text-red-500" />
                        </div>

                        <PrimaryButton
                            disabled={processing}
                            className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base py-3 rounded-[15px_5px_15px_5px] shadow-[0_6px_18px_rgba(79,70,229,0.45)] transition-all duration-200 ease-in-out transform hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {processing ? 'Sending...' : 'Send Reset Link'}
                        </PrimaryButton>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 sm:mt-8 text-center relative">
                        <a
                            href={route('login')}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            ← Back to Login
                        </a>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}

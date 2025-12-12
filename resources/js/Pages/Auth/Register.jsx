import { useEffect, useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [customErrors, setCustomErrors] = useState({
        email: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const validateField = (field, value) => {
        const newErrors = { ...customErrors };

        if (field === 'email') {
            if (!value.endsWith('@gmail.com')) {
                newErrors.email = 'Email must end with @gmail.com';
            } else {
                newErrors.email = '';
            }
        }

        if (field === 'password') {
            const minLength = value.length >= 6;
            const maxLength = value.length <= 20;
            const hasUpper = /[A-Z]/.test(value);
            const hasLower = /[a-z]/.test(value);
            const hasNumber = /\d/.test(value);

            if (!minLength) {
                newErrors.password = 'Password must be at least 6 characters';
            } else if (!maxLength) {
                newErrors.password = 'Password must not exceed 20 characters';
            } else if (!hasUpper || !hasLower || !hasNumber ) {
                newErrors.password = 'Password must contain uppercase, lowercase, number';
            } else {
                newErrors.password = '';
            }

            // Also revalidate confirmation if password changes
            if (data.password_confirmation && value !== data.password_confirmation) {
                newErrors.password_confirmation = 'Passwords do not match';
            } else {
                newErrors.password_confirmation = '';
            }
        }

        if (field === 'password_confirmation') {
            if (value !== data.password) {
                newErrors.password_confirmation = 'Passwords do not match';
            } else {
                newErrors.password_confirmation = '';
            }
        }

        setCustomErrors(newErrors);
    };

    const handleChange = (field, value) => {
        setData(field, value);
        validateField(field, value);
    };

    const submit = (e) => {
        e.preventDefault();

        if (
            customErrors.email ||
            customErrors.password ||
            customErrors.password_confirmation
        ) return;

        post(route('register'));
    };

    return (
        <>
            <Head title="Register" />

            <div className="min-h-screen flex items-center justify-center bg-[#d6e2f0] px-6">
                <div className="w-[900px] h-[600px] bg-white rounded-3xl shadow-xl flex overflow-hidden">
                    {/* LEFT FORM SIDE */}
                    <div className="w-1/2 p-10 flex flex-col justify-center">
                        <h2 className="text-3xl font-bold mb-6">Create an Account</h2>

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <InputLabel htmlFor="name" value="Name" />
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Email" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    autoComplete="username"
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    required
                                />
                                <InputError message={errors.email || customErrors.email} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Password" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    autoComplete="new-password"
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    required
                                />
                                <InputError message={errors.password || customErrors.password} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    autoComplete="new-password"
                                    onChange={(e) => handleChange('password_confirmation', e.target.value)}
                                    required
                                />
                                <InputError
                                    message={errors.password_confirmation || customErrors.password_confirmation}
                                    className="mt-2"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <Link
                                    href={route('login')}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Already registered?
                                </Link>

                                <PrimaryButton
                                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                                    disabled={processing}
                                >
                                    Register
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT IMAGE/INFO SIDE */}
                    <div className="w-1/2 bg-[#f6f9ff] flex flex-col items-center justify-center px-8 text-center">
                        <img
                            src="/images/logo.png"
                            alt="Create Account Illustration"
                            className="w-64 h-auto mb-4"
                        />
                        <h3 className="text-lg font-semibold text-gray-700">Join Our Platform</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Start managing your projects easily with real-time tools. Sign up to get started!
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

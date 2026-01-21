import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login, clearError, fetchCurrentUser } from '@/store/slices/authSlice'
import { XKubeLogo } from '@/components/Logo'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    Button,
    Input,
    VStack,
    HStack,
    Divider,
} from '@xdev-asia/x-ui-react'
import { Mail, Lock, Github, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888'
const ENABLE_GOOGLE = import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true'
const ENABLE_GITHUB = import.meta.env.VITE_ENABLE_GITHUB_OAUTH === 'true'
const SHOW_OAUTH = ENABLE_GOOGLE || ENABLE_GITHUB

export function LoginPage() {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const { error: reduxError, isLoading: reduxLoading } = useAppSelector((state) => state.auth)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        dispatch(clearError())

        try {
            // First, login to get tokens
            await dispatch(login({ email, password })).unwrap()

            // Then fetch the current user data
            await dispatch(fetchCurrentUser()).unwrap()

            // Navigate to clusters page
            navigate('/clusters')
        } catch (err) {
            // Error is handled by Redux
            console.error('Login error:', err)
        }
    }

    const handleOAuthLogin = (provider: 'google' | 'github') => {
        window.location.href = `${API_URL}/api/auth/oauth/${provider}`
    }

    if (reduxLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{
                background: 'linear-gradient(to bottom right, #0F172A, #1E1B4B, #000000)',
            }}
        >
            {/* Background Image */}
            <div
                className="absolute inset-0 opacity-40"
                style={{
                    backgroundImage: 'url(/login-bg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10" />

            <Card className="w-full max-w-md border-white/10 relative z-10 backdrop-blur-sm bg-slate-950/50">
                <CardHeader className="text-center space-y-4">
                    {/* Logo */}
                    <div className="flex justify-center">
                        <XKubeLogo size={64} className="drop-shadow-2xl" />
                    </div>
                    <CardTitle className="text-3xl text-white font-bold">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-white/70 text-base">
                        Sign in to your xKube account
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <VStack spacing={4}>
                            {/* OAuth Buttons - Only show if enabled */}
                            {SHOW_OAUTH && (
                                <>
                                    <VStack spacing={2} className="w-full">
                                        {ENABLE_GOOGLE && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-center gap-2 border-white/20 text-white hover:bg-white/5"
                                                onClick={() => handleOAuthLogin('google')}
                                            >
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path
                                                        fill="currentColor"
                                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    />
                                                    <path
                                                        fill="currentColor"
                                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    />
                                                    <path
                                                        fill="currentColor"
                                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    />
                                                    <path
                                                        fill="currentColor"
                                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    />
                                                </svg>
                                                Continue with Google
                                            </Button>
                                        )}
                                        {ENABLE_GITHUB && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-center gap-2 border-white/20 text-white hover:bg-white/5"
                                                onClick={() => handleOAuthLogin('github')}
                                            >
                                                <Github size={20} />
                                                Continue with GitHub
                                            </Button>
                                        )}
                                    </VStack>

                                    <HStack className="w-full items-center gap-3">
                                        <Divider className="flex-1" />
                                        <span className="text-white/40 text-sm">or</span>
                                        <Divider className="flex-1" />
                                    </HStack>
                                </>
                            )}

                            {/* Email/Password Form */}
                            <div className="w-full relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                    required
                                />
                            </div>

                            <div className="w-full relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                    required
                                    minLength={8}
                                />
                            </div>

                            {reduxError && (
                                <p className="text-red-400 text-sm text-center w-full">{reduxError}</p>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={reduxLoading}
                            >
                                {reduxLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </VStack>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

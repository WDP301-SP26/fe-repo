'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { getDefaultRouteForRole } from '@/lib/routes';
import { getApiBaseUrl } from '@/lib/runtime-config';
import { loginSchema, type LoginFormValues } from '@/lib/schemas/auth.schema';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Localhost often keeps stale local/session state when switching between envs.
    if (window.location.hostname === 'localhost') {
      useAuthStore.getState().logout();
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError('');

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const backendData = await response.json();
      console.log('✅ Backend login success, establishing Next.js session...');

      // Establish NextAuth session using backend token
      const signInResult = await signIn('credentials', {
        token: backendData.access_token,
        user: JSON.stringify(backendData.user),
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      // Save to Zustand store
      useAuthStore
        .getState()
        .setUser(backendData.user, backendData.access_token);

      router.push(getDefaultRouteForRole(backendData.user?.role));
      router.refresh();
    } catch (err) {
      console.error('❌ Login error:', err);
      setServerError('Email hoặc mật khẩu không đúng');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      <Card className="border-slate-800 bg-slate-900/85 text-slate-100 shadow-2xl shadow-cyan-950/30 backdrop-blur">
        <CardHeader className="space-y-3 pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Đăng Nhập Bảo Mật
          </p>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-white">
            Chào Mừng Trở Lại
          </CardTitle>
          <p className="text-sm text-slate-300">
            Sử dụng tài khoản nhà trường để tiếp tục.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-5">
              {serverError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-slate-200">
                    Email Trường
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@fpt.edu.vn"
                    {...register('email')}
                    disabled={isLoading}
                    className="h-11 border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-300">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-200">
                      Mật khẩu
                    </Label>
                    <span className="text-xs text-slate-400">
                      Quên mật khẩu? Liên hệ quản trị viên
                    </span>
                  </div>
                  <PasswordInput
                    id="password"
                    {...register('password')}
                    disabled={isLoading}
                    className="h-11 border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
                  />
                  {errors.password && (
                    <p className="text-xs text-rose-300">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-center text-xs text-slate-400"></div>
    </div>
  );
}

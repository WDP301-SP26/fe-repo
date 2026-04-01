import { LoginForm } from '@/components/login-form';
import Image from 'next/image';

export default function SignInPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.12),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,0.10),transparent_40%)]" />
      </div>

      <main className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <section className="space-y-8 text-slate-100">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/60 px-3 py-2.5 backdrop-blur sm:gap-3 sm:px-4 sm:py-3">
            <Image
              src="/brand/jihub.svg"
              alt="JiHub logo"
              width={48}
              height={48}
              className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12"
              priority
            />
            <div className="leading-tight">
              <p className="text-xs font-bold text-white sm:text-sm md:text-base">
                JiHub SWP391
              </p>
              <p className="text-xs text-slate-300">GitHub x Jira Workspace</p>
            </div>
          </div>

          <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            Cổng Điều Hành Học Phần SWP391
          </p>

          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              Một cổng duy nhất cho quản lý học kỳ, vận hành lớp học và tiến độ
              đồ án.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Đăng nhập bằng tài khoản nhà trường để vào đúng không gian làm
              việc của học phần. Tất cả tác vụ vận hành lớp, import và theo dõi
              tiến độ đều được gom về một nơi cho buổi demo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Giảng viên', desc: 'Dạy học và quy trình review' },
              { label: 'Sinh viên', desc: 'Không gian triển khai đồ án' },
            ].map((item) => (
              <article
                key={item.label}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur"
              >
                <p className="text-sm font-bold text-slate-100">{item.label}</p>
                <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="w-full">
          <LoginForm className="w-full" />
        </section>
      </main>
    </div>
  );
}

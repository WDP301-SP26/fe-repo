import Image from 'next/image';
import Link from 'next/link';

const stats = [
  { label: 'Capstone teams managed', value: '2,000+' },
  { label: 'Weekly status checkpoints', value: '15,000+' },
  { label: 'AI generated project drafts', value: '8,500+' },
];

const painPoints = [
  'Teams lose progress when topic definition is vague from day one.',
  'Lecturers spend too much time syncing Jira, GitHub, and class updates.',
  'Duplicate project topics reduce novelty and quality of final outcomes.',
];

const solutionBlocks = [
  {
    title: 'Topic Intelligence',
    text: 'Students can pick an approved topic, ask AI to suggest one, or refine their own idea with full context/problem/actors.',
  },
  {
    title: 'Workspace Provisioning',
    text: 'After topic lock-in, the system initializes GitHub + Jira integration for team execution in one flow.',
  },
  {
    title: 'Lecturer Visibility',
    text: 'Lecturers track assignment load, contributor signals, and AI reporting from one workspace.',
  },
];

const featureCards = [
  {
    title: 'No Duplicate Topic Rule',
    desc: 'The platform blocks reused topics and forces uniqueness before provisioning.',
  },
  {
    title: 'AI Topic Draft Editor',
    desc: 'Teams can review and edit context/problem/actors before saving a generated topic.',
  },
  {
    title: 'Role-Based Navigation',
    desc: 'Student, Lecturer, and Admin spaces follow clear, consistent information hierarchy.',
  },
  {
    title: 'Live Delivery Signals',
    desc: 'Combine Jira assignments and GitHub commits to observe team execution quality.',
  },
];

function LandingImage({
  src,
  alt,
  title,
  subtitle,
  priority = false,
}: {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  priority?: boolean;
}) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-slate-100/70 p-6 text-left">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      <div className="relative mt-6 h-56 overflow-hidden rounded-xl border border-slate-200 bg-white md:h-72">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900" />
            <div>
              <p className="text-sm font-semibold tracking-wide">JIHUB</p>
              <p className="text-xs text-slate-500">
                Jira x GitHub Education Workspace
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#problem" className="text-slate-600 hover:text-slate-900">
              Problem
            </a>
            <a href="#solution" className="text-slate-600 hover:text-slate-900">
              Solution
            </a>
            <a href="#workflow" className="text-slate-600 hover:text-slate-900">
              Workflow
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-12 pt-14 md:grid-cols-2 md:items-center">
        <div>
          <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
            AI-Assisted Topic and Delivery Management
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
            Turn capstone chaos into an auditable execution flow.
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-600 md:text-lg">
            From topic ideation to GitHub and Jira setup, JIHUB gives student
            teams and lecturers one control plane for execution quality.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              Start a new class workspace
            </Link>
            <Link
              href="/signin"
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Open dashboard
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="text-xl font-bold">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <LandingImage
          src="/landing/hero-visual.png"
          alt="JIHUB capabilities collage"
          title="Hero Visual Placeholder"
          subtitle="A unified view of topic quality checks, role navigation, and live execution analytics."
          priority
        />
      </section>

      <section id="problem" className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-6 rounded-2xl border border-rose-200 bg-rose-50/60 p-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">
              Problem
            </p>
            <h2 className="mt-3 text-2xl font-bold">
              Current project operations are fragmented and reactive.
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-700">
              {painPoints.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-rose-200 bg-white px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <LandingImage
            src="/landing/problem-scene.png"
            alt="Problem scene showing disconnected tools and team confusion"
            title="Problem Scene Placeholder"
            subtitle="A visual narrative showing disconnected tools, duplicated effort, and low visibility."
          />
        </div>
      </section>

      <section id="solution" className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Solution
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            One coordinated system from topic choice to execution signals.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {solutionBlocks.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Workflow
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              How teams use AI topic flow
            </h2>
            <ol className="mt-5 space-y-4 text-sm text-slate-700">
              <li className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                1. Team leader picks: Existing topic, AI Suggest New, or AI
                Refine Name.
              </li>
              <li className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                2. AI returns structured draft: topic name, context, problem,
                primary actors.
              </li>
              <li className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                3. Team reviews and saves topic. Server validates uniqueness and
                blocks duplicates.
              </li>
              <li className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                4. Workspace provisioning starts with linked GitHub and Jira.
              </li>
            </ol>
          </div>
          <LandingImage
            src="/landing/workflow-diagram.png"
            alt="Workflow diagram for topic selection, generation, validation, and workspace initialization"
            title="Workflow Diagram Placeholder"
            subtitle="A 4-step flow from topic ideation to unique validation and Jira/GitHub workspace setup."
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Key Capabilities
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Built for real classroom operations
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {featureCards.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <LandingImage
            src="/landing/capability-collage.png"
            alt="Capability collage of role-based navigation, AI topic drafting, and operational analytics"
            title="Capability Collage"
            subtitle="Visual summary of the core experience: unique topic check, AI draft editing, role-based navigation, and delivery signals."
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-8 text-center">
          <h2 className="text-3xl font-bold">
            Launch your next cohort with clearer execution control
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-700">
            Let students start with stronger topic context and give lecturers
            consistent project visibility from week one.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              Create workspace
            </Link>
            <Link
              href="/signin"
              className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

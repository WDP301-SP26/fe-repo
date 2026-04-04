interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: MarketingLayoutProps) {
  return <main className="min-h-screen w-full">{children}</main>;
}

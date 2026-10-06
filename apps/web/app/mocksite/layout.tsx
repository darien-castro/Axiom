import NavigationMenuDemo from './components/navbar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 flex w-full justify-center border-b border-border bg-background/95 p-[1vh] backdrop-blur">
        <NavigationMenuDemo />
      </header>
      <main className="flex flex-1 h-full w-full">
        {children}
      </main>
    </div>
  )
}

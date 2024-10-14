export default function PostLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  // TODO: breadcrumbs via next
  return (
    <main className="container mx-auto px-4 py-8 max-w-[1000px]">
      <div className="text-sm mb-4">
        <a href="/" className="hover:underline">
          Home
        </a>{" "}
        &gt;{" "}
        <a href="/italy" className="capitalize hover:underline">
          italy
        </a>{" "}
        &gt;
        <span>Bologna</span>
      </div>
      {children}
    </main>
  )
}

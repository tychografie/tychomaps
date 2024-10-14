export default function PostLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {

  const props = {
    region: "Italy",
    postName: "Bologna"
  }

  // TODO: breadcrumbs via next
  return (
    <main className="container mx-auto px-4 py-8 max-w-[1000px]">
      <div className="text-sm mb-4">
        <a href="/" className="hover:underline">
          Home
        </a>{" "}
        &gt;{" "}
        <a href={`/${props.region.toLowerCase()}`} className="capitalize hover:underline">
          {props.region}
        </a>{" "}
        &gt;
        <span>{props.postName}</span>
      </div>
      {children}
    </main>
  )
}

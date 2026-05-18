export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-16 pb-16">
      {children}
    </div>
  )
}

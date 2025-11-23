import LibraryClientPage from "./LibraryClientPage";

export default async function Page({ params }: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params;   // <-- FIX: unwrap here on server

  return <LibraryClientPage name={name} />;
}

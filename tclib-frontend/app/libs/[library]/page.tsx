import LibraryClientPage from "@/app/components/LibraryClientPage";

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ library: string }>;
}) {
  const { library } = await params;

  return <LibraryClientPage library={library} />;
}

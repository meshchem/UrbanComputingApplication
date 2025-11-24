import LibraryClientPage from "@/app/components/LibraryClientPage";

export default async function FloorPage({
  params,
}: {
  params: Promise<{ library: string; floor: string }>;
}) {
  const { library, floor } = await params;

  return <LibraryClientPage library={library} floor={floor} />;
}

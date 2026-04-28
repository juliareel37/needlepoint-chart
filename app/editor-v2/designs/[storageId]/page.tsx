import { EditorV2Page } from "@/components/editor-v2/app/EditorV2Page";

export default async function Page({
  params,
}: {
  params: Promise<{ storageId: string }>;
}) {
  const { storageId } = await params;

  return <EditorV2Page routeMode="saved" routeStorageId={storageId} />;
}

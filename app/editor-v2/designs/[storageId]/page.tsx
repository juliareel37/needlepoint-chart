import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ storageId: string }>;
}) {
  const { storageId } = await params;

  redirect(`/editor/designs/${storageId}`);
}

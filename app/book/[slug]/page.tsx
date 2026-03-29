import { BookingFlow } from "@/components/booking-flow";
import { parseEventQuestions } from "@/lib/questions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const event = await prisma.eventType.findUnique({
    where: { slug },
  });
  if (!event) notFound();

  const questions = parseEventQuestions(event.questions);

  return (
    <BookingFlow
      event={{
        id: event.id,
        title: event.title,
        description: event.description,
        duration: event.duration,
        slug: event.slug,
        questions,
      }}
    />
  );
}

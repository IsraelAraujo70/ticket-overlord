"use client";

import imageCompression from "browser-image-compression";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  CheckIcon,
  ClapperboardIcon,
  ImagePlusIcon,
  MapPinIcon,
  SearchIcon,
  TicketIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useFormStatus } from "react-dom";

import { PageHeader } from "@/components/molecules/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import type { ExternalMovie } from "@/features/events/event.types";
import { initialEventActionState } from "@/features/events/event.types";
import { cn } from "@/lib/utils";
import {
  createEventAction,
  searchExternalMoviesAction,
} from "@/server/events/event-actions";

const draftStorageKey = "ticket-overlord:event-creation-draft:v1";
const maxOriginalImageBytes = 5 * 1024 * 1024;
const maxCompressedImageBytes = 900 * 1024;

const steps = [
  { value: 1, label: "Filme" },
  { value: 2, label: "Sessão" },
  { value: 3, label: "Capa" },
  { value: 4, label: "Revisão" },
] as const;

type WizardStep = (typeof steps)[number]["value"];

interface SessionDraft {
  startsAtLocal: string;
  venue: string;
  city: string;
  capacity: string;
  price: string;
}

interface EventCreationDraft extends SessionDraft {
  step: WizardStep;
  query: string;
  selected: ExternalMovie | null;
}

interface CoverSelection {
  file: File;
  previewUrl: string;
}

const emptySession: SessionDraft = {
  startsAtLocal: "",
  venue: "",
  city: "",
  capacity: "",
  price: "",
};

export function EventCreationForm() {
  const router = useRouter();
  const coverFileRef = useRef<File | null>(null);
  const compressionAttemptRef = useRef(0);
  const [step, setStep] = useState<WizardStep>(1);
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<ExternalMovie[]>([]);
  const [selected, setSelected] = useState<ExternalMovie | null>(null);
  const [session, setSession] = useState<SessionDraft>(emptySession);
  const [cover, setCover] = useState<CoverSelection | null>(null);
  const [searchError, setSearchError] = useState<string>();
  const [coverError, setCoverError] = useState<string>();
  const [searched, setSearched] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSearching, startSearch] = useTransition();

  const submitWithCover = useCallback(
    async (previousState: typeof initialEventActionState, formData: FormData) => {
      const compressedCover = coverFileRef.current;

      if (!compressedCover) {
        return { status: "error" as const, message: "Envie uma imagem de capa." };
      }

      formData.set("cover", compressedCover);
      return createEventAction(previousState, formData);
    },
    [],
  );
  const [actionState, formAction] = useActionState(
    submitWithCover,
    initialEventActionState,
  );

  const startsAt = session.startsAtLocal
    ? new Date(session.startsAtLocal).toISOString()
    : "";
  const visibleMovies =
    movies.length || !selected
      ? movies
      : [selected];

  useEffect(() => {
    const draft = readDraft(window.localStorage);
    const restoration = window.setTimeout(() => {
      if (draft) {
        setStep(restorableStep(draft));
        setQuery(draft.query);
        setSelected(draft.selected);
        setSession({
          startsAtLocal: draft.startsAtLocal,
          venue: draft.venue,
          city: draft.city,
          capacity: draft.capacity,
          price: draft.price,
        });
      }

      setDraftReady(true);
    }, 0);

    return () => window.clearTimeout(restoration);
  }, []);

  useEffect(() => {
    if (!draftReady) return;

    writeDraft(window.localStorage, {
      step,
      query,
      selected,
      ...session,
    });
  }, [draftReady, query, selected, session, step]);

  useEffect(() => {
    if (actionState.status !== "success") return;

    window.localStorage.removeItem(draftStorageKey);
    router.replace("/admin/eventos?created=1");
  }, [actionState.status, router]);

  useEffect(() => {
    return () => {
      if (cover?.previewUrl) URL.revokeObjectURL(cover.previewUrl);
    };
  }, [cover?.previewUrl]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startSearch(async () => {
      const result = await searchExternalMoviesAction(query);
      setMovies(result.movies);
      setSearchError(result.error);
      setSearched(true);

      if (
        !result.movies.some(
          (movie) => movie.externalId === selected?.externalId,
        )
      ) {
        setSelected(null);
      }
    });
  }

  function updateSession(field: keyof SessionDraft, value: string) {
    setSession((current) => ({ ...current, [field]: value }));
  }

  async function selectCover(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const original = input.files?.[0];
    const attempt = compressionAttemptRef.current + 1;
    compressionAttemptRef.current = attempt;
    setCoverError(undefined);

    if (!original) {
      replaceCover(null);
      return;
    }

    if (!isAllowedImage(original)) {
      input.value = "";
      setCoverError("Escolha uma imagem JPEG, PNG ou WebP.");
      return;
    }

    if (original.size > maxOriginalImageBytes) {
      input.value = "";
      setCoverError("A imagem original deve ter no máximo 5 MiB.");
      return;
    }

    setIsCompressing(true);

    try {
      const compressed = await imageCompression(original, {
        fileType: "image/webp",
        initialQuality: 0.86,
        maxSizeMB: 0.75,
        maxWidthOrHeight: 1920,
        useWebWorker: false,
      });

      if (attempt !== compressionAttemptRef.current) return;

      const file = webpFile(compressed, original);

      if (file.size > maxCompressedImageBytes) {
        input.value = "";
        replaceCover(null);
        setCoverError(
          "Não foi possível preparar essa imagem. Escolha outro arquivo.",
        );
        return;
      }

      replaceCover({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    } catch {
      if (attempt !== compressionAttemptRef.current) return;
      input.value = "";
      replaceCover(null);
      setCoverError(
        "Não foi possível preparar essa imagem. Escolha outro arquivo.",
      );
    } finally {
      if (attempt === compressionAttemptRef.current) {
        setIsCompressing(false);
      }
    }
  }

  function replaceCover(nextCover: CoverSelection | null) {
    coverFileRef.current = nextCover?.file ?? null;
    setCover(nextCover);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <PageHeader
          eyebrow="Novo rascunho"
          title="Criar evento"
          description="Monte a sessão local em quatro etapas e revise tudo antes de salvar."
        />
        <Link
          href="/admin/eventos"
          className={buttonVariants({ variant: "outline" })}
        >
          Voltar para eventos
        </Link>
      </div>

      <Card className="mx-auto w-full max-w-6xl">
        <WizardProgress step={step} />

        {step === 1 ? (
          <>
            <CardContent className="flex flex-col gap-6">
              <StepHeading
                eyebrow="Catálogo externo"
                title="Escolha o filme"
                description="Busque no TMDb e selecione a obra que dará origem ao evento local."
              />

              <form onSubmit={search}>
                <FieldGroup>
                  <Field data-invalid={Boolean(searchError) || undefined}>
                    <FieldLabel htmlFor="movie-query">Título do filme</FieldLabel>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="movie-query"
                        value={query}
                        onChange={(event) => setQuery(event.currentTarget.value)}
                        minLength={2}
                        maxLength={100}
                        placeholder="Ex.: Interestelar"
                        aria-invalid={Boolean(searchError) || undefined}
                        required
                      />
                      <Button type="submit" disabled={isSearching}>
                        {isSearching ? (
                          <Spinner data-icon="inline-start" />
                        ) : (
                          <SearchIcon data-icon="inline-start" />
                        )}
                        {isSearching ? "Buscando" : "Buscar no TMDb"}
                      </Button>
                    </div>
                    <FieldError>{searchError}</FieldError>
                  </Field>
                </FieldGroup>
              </form>

              {searched && !isSearching && !movies.length && !searchError ? (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ClapperboardIcon />
                    </EmptyMedia>
                    <EmptyTitle>Nenhum filme encontrado</EmptyTitle>
                    <EmptyDescription>
                      Tente outro título ou confira a escrita da busca.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null}

              {visibleMovies.length ? (
                <section
                  aria-labelledby="movie-results-title"
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 id="movie-results-title" className="font-medium">
                      {movies.length ? "Resultados" : "Filme selecionado"}
                    </h3>
                    <Badge variant="outline">
                      {visibleMovies.length}{" "}
                      {visibleMovies.length === 1 ? "filme" : "filmes"}
                    </Badge>
                  </div>
                  <ScrollArea className="h-[32rem] max-h-[55vh] rounded-xl border">
                    <div className="grid gap-3 p-3 xl:grid-cols-2">
                      {visibleMovies.map((movie) => (
                        <MovieChoice
                          key={movie.externalId}
                          movie={movie}
                          selected={selected?.externalId === movie.externalId}
                          onSelect={() => setSelected(movie)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </section>
              ) : null}
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <Link
                href="/admin/eventos"
                className={buttonVariants({ variant: "ghost" })}
              >
                Cancelar
              </Link>
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selected}
              >
                Continuar
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardFooter>
          </>
        ) : null}

        {step === 2 && selected ? (
          <>
            <CardContent className="flex flex-col gap-6">
              <StepHeading
                eyebrow="Operação local"
                title="Defina a sessão"
                description="Data, local, capacidade e preço pertencem a este evento no Ticket Overlord."
              />

              <SelectedMovieSummary movie={selected} />

              <form
                id="event-session-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setStep(3);
                }}
              >
                <FieldGroup className="grid gap-5 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="event-starts-at">Data e hora</FieldLabel>
                    <Input
                      id="event-starts-at"
                      type="datetime-local"
                      value={session.startsAtLocal}
                      onChange={(event) =>
                        updateSession("startsAtLocal", event.currentTarget.value)
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="event-venue">Local</FieldLabel>
                    <Input
                      id="event-venue"
                      value={session.venue}
                      onChange={(event) =>
                        updateSession("venue", event.currentTarget.value)
                      }
                      minLength={2}
                      maxLength={180}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="event-city">Cidade</FieldLabel>
                    <Input
                      id="event-city"
                      value={session.city}
                      onChange={(event) =>
                        updateSession("city", event.currentTarget.value)
                      }
                      minLength={2}
                      maxLength={120}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="event-capacity">Capacidade</FieldLabel>
                    <Input
                      id="event-capacity"
                      value={session.capacity}
                      onChange={(event) =>
                        updateSession("capacity", event.currentTarget.value)
                      }
                      type="number"
                      min={1}
                      max={1000000}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="event-price">
                      Preço do ingresso
                    </FieldLabel>
                    <Input
                      id="event-price"
                      value={session.price}
                      onChange={(event) =>
                        updateSession("price", event.currentTarget.value)
                      }
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                    />
                    <FieldDescription>
                      Valor em reais, sem taxa adicional.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeftIcon data-icon="inline-start" />
                Voltar
              </Button>
              <Button type="submit" form="event-session-form">
                Continuar
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardFooter>
          </>
        ) : null}

        {step === 3 && selected ? (
          <>
            <CardContent className="flex flex-col gap-6">
              <StepHeading
                eyebrow="Identidade visual"
                title="Escolha a capa"
                description="Use uma imagem horizontal que represente bem o evento."
              />

              <form
                id="event-cover-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (cover) setStep(4);
                }}
                className="flex flex-col gap-5"
              >
                {cover ? (
                  <div className="overflow-hidden rounded-xl border">
                    <Image
                      src={cover.previewUrl}
                      alt="Prévia da capa compactada"
                      width={1280}
                      height={720}
                      unoptimized
                      className="aspect-video max-h-96 w-full object-cover"
                    />
                  </div>
                ) : (
                  <Empty className="border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ImagePlusIcon />
                      </EmptyMedia>
                      <EmptyTitle>A capa ainda não foi escolhida</EmptyTitle>
                      <EmptyDescription>
                        Prefira uma imagem horizontal para destacar o evento.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}

                <FieldGroup>
                  <Field data-invalid={Boolean(coverError) || undefined}>
                    <FieldLabel htmlFor="event-cover">Arquivo</FieldLabel>
                    <Input
                      id="event-cover"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={selectCover}
                      aria-invalid={Boolean(coverError) || undefined}
                      disabled={isCompressing}
                      required={!cover}
                    />
                    <FieldDescription>
                      Imagem em JPEG, PNG ou WebP com até 5 MiB.
                    </FieldDescription>
                    <FieldError>{coverError}</FieldError>
                  </Field>
                </FieldGroup>

                {isCompressing ? (
                  <Alert>
                    <Spinner />
                    <AlertTitle>Preparando imagem</AlertTitle>
                    <AlertDescription>
                      Aguarde um instante para continuar.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </form>
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeftIcon data-icon="inline-start" />
                Voltar
              </Button>
              <Button
                type="submit"
                form="event-cover-form"
                disabled={!cover || isCompressing}
              >
                Revisar evento
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardFooter>
          </>
        ) : null}

        {step === 4 && selected && cover ? (
          <form action={formAction} className="contents">
            <input type="hidden" name="externalId" value={selected.externalId} />
            <input type="hidden" name="startsAt" value={startsAt} />
            <input type="hidden" name="venue" value={session.venue} />
            <input type="hidden" name="city" value={session.city} />
            <input type="hidden" name="capacity" value={session.capacity} />
            <input type="hidden" name="price" value={session.price} />

            <CardContent className="flex flex-col gap-6">
              <StepHeading
                eyebrow="Conferência"
                title="Revise o evento"
                description="Confira os dados antes de criar o rascunho. Ele ainda não ficará visível no site público."
              />

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div className="overflow-hidden rounded-xl border">
                  <Image
                    src={cover.previewUrl}
                    alt={`Capa de ${selected.title}`}
                    width={1280}
                    height={720}
                    unoptimized
                    className="aspect-video h-full w-full object-cover"
                  />
                </div>
                <Card size="sm">
                  <CardHeader>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Rascunho</Badge>
                      <Badge variant="outline">TMDb #{selected.externalId}</Badge>
                    </div>
                    <CardTitle>{selected.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {selected.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <ReviewItem
                        icon={CalendarClockIcon}
                        label="Data e hora"
                        value={formatStartsAt(session.startsAtLocal)}
                      />
                      <ReviewItem
                        icon={MapPinIcon}
                        label="Local"
                        value={`${session.venue} · ${session.city}`}
                      />
                      <ReviewItem
                        icon={TicketIcon}
                        label="Capacidade"
                        value={`${Number(session.capacity).toLocaleString("pt-BR")} ingressos`}
                      />
                      <ReviewItem
                        icon={TicketIcon}
                        label="Preço"
                        value={formatPrice(session.price)}
                      />
                    </dl>
                  </CardContent>
                </Card>
              </div>

              {actionState.status === "error" ? (
                <Alert variant="destructive">
                  <AlertTitle>Não foi possível criar o evento</AlertTitle>
                  <AlertDescription>{actionState.message}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                <ArrowLeftIcon data-icon="inline-start" />
                Voltar
              </Button>
              <CreateEventSubmit />
            </CardFooter>
          </form>
        ) : null}
      </Card>
    </div>
  );
}

function WizardProgress({ step }: { step: WizardStep }) {
  return (
    <CardHeader className="border-b">
      <Progress value={step * 25}>
        <ProgressLabel>Etapa {step} de 4</ProgressLabel>
        <ProgressValue />
      </Progress>
      <ol className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4">
        {steps.map((item) => (
          <li
            key={item.value}
            aria-current={item.value === step ? "step" : undefined}
            className="flex items-center gap-2"
          >
            <Badge
              variant={item.value === step ? "default" : "outline"}
              className="tabular-nums"
            >
              {String(item.value).padStart(2, "0")}
            </Badge>
            <span
              className={cn(
                "text-sm",
                item.value === step
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ol>
    </CardHeader>
  );
}

function StepHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="font-mono text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <h2 className="font-heading text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function MovieChoice({
  movie,
  selected,
  onSelect,
}: {
  movie: ExternalMovie;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card size="sm" className="grid min-h-40 grid-cols-[6rem_minmax(0,1fr)] gap-0 py-0">
      <div className="relative overflow-hidden rounded-l-xl bg-muted">
        {movie.imageUrl ? (
          <Image
            src={movie.imageUrl}
            alt={`Pôster de ${movie.title}`}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ClapperboardIcon className="size-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col py-3">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">TMDb #{movie.externalId}</Badge>
            {movie.releaseDate ? (
              <Badge variant="secondary">{movie.releaseDate.slice(0, 4)}</Badge>
            ) : null}
            {selected ? <Badge>Selecionado</Badge> : null}
          </div>
          <CardTitle>{movie.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {movie.summary}
          </CardDescription>
        </CardHeader>
        <CardFooter className="mt-auto border-0 bg-transparent pt-2">
          <Button
            type="button"
            size="sm"
            variant={selected ? "secondary" : "outline"}
            onClick={onSelect}
            aria-pressed={selected}
          >
            {selected ? <CheckIcon data-icon="inline-start" /> : null}
            {selected ? "Selecionado" : "Selecionar filme"}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}

function SelectedMovieSummary({ movie }: { movie: ExternalMovie }) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Filme selecionado</Badge>
          <Badge variant="outline">TMDb #{movie.externalId}</Badge>
        </div>
        <CardTitle>{movie.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {movie.summary}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function ReviewItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClockIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-2">
      <Icon className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
      <dt className="text-xs font-medium text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="col-start-2 font-medium">{value}</dd>
    </div>
  );
}

function CreateEventSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {pending ? "Criando rascunho" : "Criar rascunho"}
    </Button>
  );
}

function readDraft(storage: Storage): EventCreationDraft | null {
  try {
    const rawDraft = storage.getItem(draftStorageKey);
    if (!rawDraft) return null;

    const parsed: unknown = JSON.parse(rawDraft);
    if (!isRecord(parsed)) return null;

    return {
      step: parseStep(parsed.step),
      query: stringValue(parsed.query),
      selected: parseMovie(parsed.selected),
      startsAtLocal: stringValue(parsed.startsAtLocal),
      venue: stringValue(parsed.venue),
      city: stringValue(parsed.city),
      capacity: stringValue(parsed.capacity),
      price: stringValue(parsed.price),
    };
  } catch {
    return null;
  }
}

function writeDraft(storage: Storage, draft: EventCreationDraft) {
  try {
    storage.setItem(draftStorageKey, JSON.stringify(draft));
  } catch {
    // A blocked or full storage must not prevent event creation.
  }
}

function restorableStep(draft: EventCreationDraft): WizardStep {
  if (!draft.selected) return 1;
  if (draft.step >= 3 && !hasCompleteSession(draft)) return 2;
  if (draft.step >= 4) return 3;
  return draft.step;
}

function hasCompleteSession(draft: SessionDraft): boolean {
  return Boolean(
    draft.startsAtLocal &&
      draft.venue &&
      draft.city &&
      Number(draft.capacity) > 0 &&
      Number(draft.price.replace(",", ".")) > 0,
  );
}

function parseMovie(value: unknown): ExternalMovie | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.externalId !== "string" ||
    typeof value.title !== "string" ||
    typeof value.summary !== "string"
  ) {
    return null;
  }

  return {
    externalId: value.externalId,
    title: value.title,
    summary: value.summary,
    releaseDate: typeof value.releaseDate === "string" ? value.releaseDate : null,
    imageUrl: typeof value.imageUrl === "string" ? value.imageUrl : null,
  };
}

function parseStep(value: unknown): WizardStep {
  return value === 2 || value === 3 || value === 4 ? value : 1;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAllowedImage(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

function webpFile(compressed: File, original: File): File {
  const baseName = original.name.replace(/\.[^.]+$/, "") || "event-cover";
  return new File([compressed], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: original.lastModified,
  });
}

function formatStartsAt(value: string): string {
  if (!value) return "Não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPrice(value: string): string {
  const price = Number(value.replace(",", "."));
  return Number.isFinite(price)
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(price)
    : "Não informado";
}

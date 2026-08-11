"use client";

import Image from "next/image";
import { useActionState, useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircleIcon,
  CheckIcon,
  ClapperboardIcon,
  ImagePlusIcon,
  SearchIcon,
} from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import type { ExternalMovie } from "@/features/events/event.types";
import { initialEventActionState } from "@/features/events/event.types";
import {
  createEventAction,
  searchExternalMoviesAction,
} from "@/server/events/event-actions";
import Link from "next/link";

export function EventCreationForm() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<ExternalMovie[]>([]);
  const [selected, setSelected] = useState<ExternalMovie | null>(null);
  const [searchError, setSearchError] = useState<string>();
  const [searched, setSearched] = useState(false);
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [isSearching, startSearch] = useTransition();
  const [state, formAction] = useActionState(
    createEventAction,
    initialEventActionState,
  );
  const startsAt = startsAtLocal
    ? new Date(startsAtLocal).toISOString()
    : "";

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startSearch(async () => {
      const result = await searchExternalMoviesAction(query);
      setMovies(result.movies);
      setSearchError(result.error);
      setSearched(true);
      if (!result.movies.some((movie) => movie.externalId === selected?.externalId)) {
        setSelected(null);
      }
    });
  }

  function preview(file: File | undefined) {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : undefined;
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <PageHeader
          eyebrow="Novo rascunho"
          title="Criar evento"
          description="Escolha a obra no catálogo externo e defina a operação da sessão local."
        />
        <Link
          href="/admin/eventos"
          className={buttonVariants({ variant: "outline" })}
        >
          Voltar para eventos
        </Link>
      </div>

      <section aria-labelledby="catalog-step-title" className="flex flex-col gap-4">
        <div>
          <p className="font-mono text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            1 · Catálogo externo
          </p>
          <h2 id="catalog-step-title" className="font-heading text-2xl font-bold">
            Encontre o filme
          </h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Busca no TMDb</CardTitle>
            <CardDescription>
              O título e a sinopse selecionados serão copiados para o evento local.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={search}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="movie-query">Título do filme</FieldLabel>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="movie-query"
                      value={query}
                      onChange={(event) => setQuery(event.currentTarget.value)}
                      minLength={2}
                      maxLength={100}
                      placeholder="Ex.: Interestelar"
                      required
                    />
                    <Button type="submit" disabled={isSearching}>
                      {isSearching ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <SearchIcon data-icon="inline-start" />
                      )}
                      {isSearching ? "Buscando" : "Buscar"}
                    </Button>
                  </div>
                  <FieldError>{searchError}</FieldError>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

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

        {movies.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {movies.map((movie) => {
              const isSelected = selected?.externalId === movie.externalId;
              return (
                <Card key={movie.externalId} size="sm">
                  {movie.imageUrl ? (
                    <Image
                      src={movie.imageUrl}
                      alt={`Pôster de ${movie.title}`}
                      width={500}
                      height={750}
                      className="aspect-[2/3] w-full object-cover"
                    />
                  ) : null}
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">TMDb #{movie.externalId}</Badge>
                      {movie.releaseDate ? (
                        <Badge variant="secondary">{movie.releaseDate.slice(0, 4)}</Badge>
                      ) : null}
                    </div>
                    <CardTitle>{movie.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {movie.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button
                      type="button"
                      variant={isSelected ? "secondary" : "outline"}
                      onClick={() => setSelected(movie)}
                    >
                      {isSelected ? <CheckIcon data-icon="inline-start" /> : null}
                      {isSelected ? "Selecionado" : "Selecionar filme"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : null}
      </section>

      {selected ? (
        <form action={formAction} className="flex flex-col gap-6">
          <input type="hidden" name="externalId" value={selected.externalId} />
          <input type="hidden" name="startsAt" value={startsAt} />

          <section aria-labelledby="operation-step-title" className="flex flex-col gap-4">
            <div>
              <p className="font-mono text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                2 · Operação local
              </p>
              <h2 id="operation-step-title" className="font-heading text-2xl font-bold">
                Defina a sessão
              </h2>
            </div>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Filme selecionado</Badge>
                  <Badge variant="outline">TMDb #{selected.externalId}</Badge>
                </div>
                <CardTitle>{selected.title}</CardTitle>
                <CardDescription>{selected.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-5 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="event-starts-at">Data e hora</FieldLabel>
                      <Input
                        id="event-starts-at"
                        type="datetime-local"
                        value={startsAtLocal}
                        onChange={(event) => setStartsAtLocal(event.currentTarget.value)}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="event-venue">Local</FieldLabel>
                      <Input id="event-venue" name="venue" minLength={2} maxLength={180} required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="event-city">Cidade</FieldLabel>
                      <Input id="event-city" name="city" minLength={2} maxLength={120} required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="event-capacity">Capacidade</FieldLabel>
                      <Input id="event-capacity" name="capacity" type="number" min={1} max={1000000} required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="event-price">Preço do ingresso</FieldLabel>
                      <Input id="event-price" name="price" type="number" min="0.01" step="0.01" required />
                      <FieldDescription>Valor em reais, sem taxa adicional.</FieldDescription>
                    </Field>
                </FieldGroup>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="cover-step-title" className="flex flex-col gap-4">
            <div>
              <p className="font-mono text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                3 · Capa
              </p>
              <h2 id="cover-step-title" className="font-heading text-2xl font-bold">
                Apresente o evento
              </h2>
            </div>
            <Card>
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Prévia da capa escolhida"
                  width={1280}
                  height={720}
                  unoptimized
                  className="aspect-video w-full object-cover"
                />
              ) : null}
              <CardHeader>
                <CardTitle>Imagem de capa</CardTitle>
                <CardDescription>
                  Use uma imagem horizontal em JPEG, PNG ou WebP com até 5 MiB.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="event-cover">
                      <ImagePlusIcon aria-hidden="true" />
                      Arquivo
                    </FieldLabel>
                    <Input
                      id="event-cover"
                      name="cover"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => preview(event.currentTarget.files?.[0])}
                      required
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
          </section>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Não foi possível criar o evento</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/eventos"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Cancelar
            </Link>
            <CreateEventSubmit />
          </div>
        </form>
      ) : null}
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

interface PageHeaderProps {
  description?: string;
  eyebrow?: string;
  title: string;
}

export function PageHeader({ description, eyebrow, title }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow ? (
        <p className="font-mono text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-heading text-4xl leading-none font-bold tracking-tight uppercase md:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

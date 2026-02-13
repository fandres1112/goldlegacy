type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionTitle({ eyebrow, title, description, align = "left" }: Props) {
  const alignment =
    align === "center"
      ? "items-center text-center mx-auto"
      : "items-start text-left";

  return (
    <div className={`flex flex-col gap-2 mb-8 ${alignment} max-w-2xl`}>
      {eyebrow && (
        <span className="text-[11px] uppercase tracking-[0.25em] text-gold-light/80">
          {eyebrow}
        </span>
      )}
      <h2 className="heading-section">{title}</h2>
      {description && (
        <p className="text-muted text-sm md:text-base">{description}</p>
      )}
    </div>
  );
}


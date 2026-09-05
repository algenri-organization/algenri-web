type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className = "h-auto w-[190px]", priority = false }: BrandLogoProps) {
  return (
    <img
      src="/algenri-logo.webp"
      alt="ALGENRI — Soluções Digitais & IA"
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}

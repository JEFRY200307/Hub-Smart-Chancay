import Image from "next/image";
import { Link } from "@/navigation";

const LOGO_SRC = "/logo-comex.png";

type BrandLogoProps = {
  /** Altura visual del logo (ancho proporcional ~3:1) */
  height?: number;
  className?: string;
  href?: string;
  priority?: boolean;
};

export default function BrandLogo({
  height = 36,
  className = "",
  href,
  priority = false,
}: BrandLogoProps) {
  const width = Math.round(height * 3.2);
  const img = (
    <Image
      src={LOGO_SRC}
      alt="COMEX.AI"
      width={width}
      height={height}
      className={`object-contain object-left ${className}`}
      style={{ height, width: "auto", maxWidth: width }}
      priority={priority}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center shrink-0">
        {img}
      </Link>
    );
  }

  return <span className="inline-flex items-center shrink-0">{img}</span>;
}

export const BRAND_NAME = "COMEX.AI";

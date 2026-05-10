import Image from "next/image";

const LOGO_SRC = "/assets/brand/rankster-logo.png";

const sizeClassNames = {
  sm: "h-8 w-10 rounded-xl",
  md: "h-14 w-20 rounded-2xl",
  lg: "h-16 w-24 rounded-2xl",
} as const;

interface AppLogoProps {
  size?: keyof typeof sizeClassNames;
  className?: string;
}

export function AppLogo({ size = "sm", className = "" }: AppLogoProps) {
  return (
    <div className={`relative overflow-hidden bg-white shadow-sm ring-1 ring-gray-100 ${sizeClassNames[size]} ${className}`}>
      <Image
        src={LOGO_SRC}
        alt="Rankster logo"
        fill
        sizes={size === "sm" ? "40px" : size === "md" ? "80px" : "96px"}
        className="scale-[1.45] object-contain"
        priority={size !== "sm"}
      />
    </div>
  );
}

import Image from "next/image";

export function MMLLogo() {
  return (
    <div className="relative w-[120px] h-[40px]">
      <Image
        src="/MML-logo.png"
        alt="MML Logo"
        fill
        sizes="120px"
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
} 
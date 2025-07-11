import Image from "next/image";

export function MMLLogo() {
  return (
    <div className="relative w-[144px] h-[48px]">
      <Image
        src="/MML-logo.png"
        alt="MML Logo"
        fill
        sizes="144px"
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
} 
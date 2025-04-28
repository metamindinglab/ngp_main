import Image from "next/image";
import Head from "next/head";

export function MMLLogo() {
  return (
    <>
      <Head>
        <link
          rel="preload"
          href="/MML-logo.png"
          as="image"
          type="image/png"
        />
      </Head>
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
    </>
  );
} 
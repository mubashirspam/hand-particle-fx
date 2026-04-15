import dynamic from "next/dynamic";
import Head from "next/head";

// Dynamic import to avoid SSR issues with Three.js and MediaPipe
const ParticleScene = dynamic(
  () =>
    import("@/components/ParticleScene").then((mod) => mod.ParticleScene),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <Head>
        <title>Particle FX — Hand Gesture Particle Engine</title>
        <meta
          name="description"
          content="Real-time 3D hand gesture particle system with Three.js and MediaPipe. Control 15,000 particles with your hands."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#030008" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:title" content="Particle FX — Hand Gesture Particle Engine" />
        <meta
          property="og:description"
          content="Control 15,000 particles in real-time using hand gestures. Iron Man repulsor blasts, galaxies, fireworks, and more."
        />
        <meta property="og:type" content="website" />
      </Head>

      <main className="w-full h-screen bg-void">
        <ParticleScene />
      </main>
    </>
  );
}

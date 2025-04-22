import { useEffect, useRef, useState } from 'react';
import { useTheme } from './theme-provider';

export default function BackgroundFX() {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let effectInstance: any;

    const initVanta = async () => {
      if (!vantaRef.current) return;

      const [THREE, VANTA] = await Promise.all([
        import('three'),
        import('vanta/dist/vanta.birds.min')
      ]);

      effectInstance = VANTA.default({
        el: vantaRef.current,
        THREE: THREE.default,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        backgroundColor: resolvedTheme === 'dark' ? 0x071127 : 0xffffff,
        color1: resolvedTheme === 'dark' ? 0x4f46e5 : 0x7c3aed,
        color2: resolvedTheme === 'dark' ? 0x6d28d9 : 0x4f46e5,
        colorMode: "lerp",
        birdSize: resolvedTheme === 'dark' ? 0.8 : 1.0,
        wingSpan: resolvedTheme === 'dark' ? 35 : 40,
        speedLimit: resolvedTheme === 'dark' ? 3 : 4,
        separation: resolvedTheme === 'dark' ? 35 : 30,
        alignment: resolvedTheme === 'dark' ? 40 : 35,
        cohesion: resolvedTheme === 'dark' ? 40 : 35,
        quantity: resolvedTheme === 'dark' ? 3 : 4
      });

      setVantaEffect(effectInstance);
    };

    // Clean up before reinitializing
    if (vantaEffect) {
      vantaEffect.destroy();
      setVantaEffect(null);
    }

    initVanta();

    return () => {
      if (effectInstance) effectInstance.destroy();
    };
  }, [resolvedTheme]);

  return (
    <div
      ref={vantaRef}
      className="fixed inset-0 -z-10"
      style={{
        minHeight: '100vh',
        opacity: resolvedTheme === 'dark' ? 0.7 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
}

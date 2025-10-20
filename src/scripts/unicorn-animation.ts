// Load GSAP and ScrollTrigger from CDN
const loadGSAP = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).gsap) {
      resolve((window as any).gsap);
      return;
    }
    
    const script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
      script2.onload = () => {
        (window as any).gsap.registerPlugin((window as any).ScrollTrigger);
        resolve((window as any).gsap);
      };
      document.head.appendChild(script2);
    };
    document.head.appendChild(script1);
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  const gsap = await loadGSAP() as any;
  
  // Unicorn sprite animation
  const frame_count = 5;
  const offset_value = 565; // Correct sprite width
  
  gsap.to(".unicorn", {
    backgroundPosition: `-${offset_value * (frame_count - 1)}px 0`,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
    }
  });
});

"use client";

import { useEffect, useRef, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Is nznt's hub free?", a: "Yes. The Free edition includes autofarms for several games. Premium unlocks more games, faster updates and priority support." },
  { q: "Which executors are supported?", a: "All major executors. If yours isn't officially supported, the UI will tell you up front instead of silently breaking." },
  { q: "How do I get Premium?", a: "Grab it from nznt.store and link your key in the loader. Activation is instant." },
  { q: "Where can I get help?", a: "Join the Discord — that's where updates drop and where the team and community help out fastest." },
];

export const FAQ = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
  <section ref={sectionRef} id="faq" className="relative py-28">
    <div className="container max-w-3xl mx-auto px-4">
      <div className={`text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">FAQ</p>
        <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-gradient">
          Questions, answered.
        </h2>
      </div>
      <Accordion type="single" collapsible className={`mt-12 space-y-2 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {faqs.map((f, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="rounded-2xl border border-border/80 bg-card/40 px-6 data-[state=open]:border-primary/30 data-[state=open]:bg-card/70 transition-colors"
          >
            <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
  );
};

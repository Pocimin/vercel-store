"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import React from "react";

interface AnimatedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedLink({ href, children, className }: AnimatedLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <Link href={href} onClick={handleClick} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

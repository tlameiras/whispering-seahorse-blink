"use client";

import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-card border-t py-4 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        Created by <strong className="font-semibold">Tiago Lameiras</strong> in a <strong className="font-semibold">Priceless</strong> morning of vibe coding | 2025
      </div>
    </footer>
  );
};

export default Footer;
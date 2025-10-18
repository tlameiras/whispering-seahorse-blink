"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const Navbar: React.FC = () => {
  const isMobile = useIsMobile();

  const navLinks = (
    <>
      <NavigationMenuItem>
        <Link to="/">
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            Home
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <Link to="/user-story-analyzer">
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            User Story Analyzer
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="mr-4 flex items-center space-x-2">
          <span className="font-bold text-lg">Internal Tools Hub</span>
        </Link>

        {isMobile ? (
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 pt-6">
                  {navLinks}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-end space-x-4">
            <NavigationMenu>
              <NavigationMenuList>
                {navLinks}
              </NavigationMenuList>
            </NavigationMenu>
            <ThemeToggle />
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
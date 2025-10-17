"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  bulletPoints: string[];
  linkTo: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, description, bulletPoints, linkTo }) => {
  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-shadow duration-200 ease-in-out">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground mb-4">
          {bulletPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
        <Link to={linkTo}>
          <Button className="w-full">
            Use Tool <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ToolCard;
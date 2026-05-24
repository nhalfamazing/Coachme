"use client";

import * as React from "react";
import { MessageSquare, Phone, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function sanitizePhone(value: string): string {
  // Strip everything except digits and a leading "+". Keeps the URL schemes happy.
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  return hasPlus ? `+${digits}` : digits;
}

export function ConnectCard() {
  const [phone, setPhone] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const clean = sanitizePhone(phone);
  const isValid = clean.replace(/^\+/, "").length >= 7;

  const open = (scheme: "facetime" | "facetime-audio" | "sms") => {
    if (!isValid) {
      setError("Enter a phone number with at least 7 digits.");
      return;
    }
    setError(null);
    // FaceTime + SMS open via URL schemes. Works on iOS / macOS. Silently no-ops elsewhere.
    window.location.href = `${scheme}:${clean}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Connect with your coach</CardTitle>
        <CardDescription>
          Drop in a phone number to start a FaceTime call or send a text.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+1 555 123 4567"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (error) setError(null);
            }}
          />
          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Country code optional. Spaces and dashes are fine.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={() => open("facetime")}
            aria-label="Start a FaceTime video call"
          >
            <Video aria-hidden="true" />
            FaceTime
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => open("facetime-audio")}
            aria-label="Start a FaceTime audio call"
          >
            <Phone aria-hidden="true" />
            Audio
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => open("sms")}
            aria-label="Send a text message"
          >
            <MessageSquare aria-hidden="true" />
            Text
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          FaceTime requires iPhone, iPad, or a Mac. Texting opens your default
          messaging app.
        </p>
      </CardContent>
    </Card>
  );
}

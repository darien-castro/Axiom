"use client";
import Image from "next/image";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

type VerificationStatus = 'idle' | 'loading' | 'success' | 'error';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const router = useRouter();

  const checkForCookie = async () => {
    const cookieName = 'AxiomCookie';
    const exists = document.cookie.split('; ').some((row) => row.startsWith(`${cookieName}=`));
    if (exists) {
      // try catch block for verfication to see if cookie is valid
      // if valid push to site
      router.push('/site/dashboard');
    }
  }

  const wait = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
  const handleAction = async (val: string) => {
    if (!val.trim() || status === 'loading') return;
    setInputValue(val);
    if (val === 'mocksite') {
      setStatus('success');
      setTimeout(() => {
        router.push('/mocksite');
      }, 2000);
      return;
    }

    const payload = {
      apiKey: val
    };
    setStatus('loading');
    try {
      const response = await fetch("http://localhost:5000/api/verify", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      await wait(1000);
      if (response.status === 200) {
        setStatus('success');
        const data = await response.text();
        console.log(data);
        await wait(1000);
        router.push('/site/dashboard');
      } else {
        setStatus('error');
        const errorData = await response.json().catch(() => null);
        console.error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      setStatus('error');
      console.error('Error verifying Canvas API Key:', error);
    }
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 bg-background p-4 text-foreground">
      <div className="flex items-baseline gap-3">
        <h1 className="font-sans text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Axiom
        </h1>
        <span className="rounded-full border border-emerald-200/60 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-3 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
          @UNCC
        </span>
      </div>
      <div className="flex flex-col items-center gap-6">
        <Card
          className={`group flex ${
            status === 'success' ? 'w-[450px]' : 'w-[320px]'
          } flex-row items-center overflow-hidden border border-border bg-card shadow-xl transition-all duration-500 ease-out hover:w-[450px]`}
        >
          <div className="min-w-[320px] shrink-0">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">
                Requires Canvas API key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Field className="flex flex-col gap-2">
                <FieldLabel htmlFor="input-demo-api-key" className="text-foreground/80">
                  API Key
                </FieldLabel>
                <Input
                  id="input-demo-api-key"
                  type="password"
                  placeholder="sk-..."
                  disabled={status === 'loading'}
                  className="border-input bg-muted/40 text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAction(e.currentTarget.value);
                    }
                  }}
                />
                <FieldDescription className="text-muted-foreground">
                  Your API key is encrypted and stored securely.
                </FieldDescription>
              </Field>
            </CardContent>
          </div>

          <div
            className={`flex w-full items-center justify-center pr-6 ${
              status === 'success' ? 'opacity-100' : 'opacity-0'
            } transition-opacity delay-75 duration-500 group-hover:opacity-100`}
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-border">
              {status === 'success' && (
                <Image
                  key="success-gif"
                  src="/success_checkmark.gif"
                  alt="Success"
                  fill
                  className="object-cover"
                />
              )}
              {status === 'error' && (
                <Image
                  key={`failed-gif-${inputValue}`} // Using inputValue in key forces restart when they try again
                  src="/failed_x.gif"
                  alt="Failed"
                  fill
                  className="object-cover"
                />
              )}
              {(status === 'idle' || status === 'loading') && (
                <Image
                  src="/smile.jpg"
                  alt="Default Smile"
                  fill
                  className="object-cover"
                />
              )}
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-3 w-full justify-center">
          <Separator className="w-16 bg-border/60" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground/80 font-medium">or</span>
          <Separator className="w-16 bg-border/60" />
        </div>

        <Button
          variant="outline"
          onClick={() => handleAction('mocksite')}
          disabled={status === 'loading' || status === 'success'}
          className="rounded-full px-6 py-2.5 h-auto text-sm font-medium border-border/80 bg-card/60 backdrop-blur-sm hover:bg-card hover:border-primary/50 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 group"
        >
          <span>{status === 'success' ? 'Entering Mocksite...' : 'Try Mocksite'}</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
          />
        </Button>
      </div>
    </div>
  );
}

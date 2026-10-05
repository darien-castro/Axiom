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

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [showGif, setShowGif] = useState(false);
  const router = useRouter();
  const handleAction = (val) => {
    setInputValue(val); 

    if (val === 'testing') {
      setShowGif(true); 

      setTimeout(() => {
        router.push('/mocksite');
      }, 2000);
    } else {
      setShowGif(false);
    }
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 bg-black p-4 text-white">
      
      <div className="text-center">
        <h1 className="bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent">
          Axiom
        </h1>
      </div>
      
      <div className="w-[25vw] flex justify-center items-center">
        <Separator/>
      </div>
      
      <div>
        <Card className="group flex w-[320px] flex-row items-center overflow-hidden border border-white/10 bg-zinc-950 shadow-xl transition-all duration-500 ease-out hover:w-[450px]">
          <div className="min-w-[320px] shrink-0">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100">
                Requires Canvas API key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Field className="flex flex-col gap-2">
                <FieldLabel htmlFor="input-demo-api-key" className="text-zinc-400">
                  API Key
                </FieldLabel>
                  <Input 
                    id="input-demo-api-key" 
                    type="password" 
                    placeholder="sk-..." 
                    className="border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAction(e.currentTarget.value);
                      }
                    }}
                  />
                <FieldDescription className="text-zinc-500">
                  Your API key is encrypted and stored securely.
                </FieldDescription>
              </Field>
            </CardContent>
          </div>

          <div className="flex w-full items-center justify-center pr-6 opacity-0 transition-opacity delay-75 duration-500 group-hover:opacity-100">
            <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-white/20">
              
              {(() => {
                if (showGif) {
                  return (
                    <Image 
                      key="success-gif" 
                      src="/success_checkmark.gif" 
                      alt="Success"
                      fill
                      className="object-cover"
                    />
                  )
                }
                else if (!showGif && inputValue !== '' && inputValue !== 'testing') {
                  return (
                    <Image 
                      key={`failed-gif-${inputValue}`} // Using inputValue in key forces restart when they try again
                      src="/failed_x.gif" 
                      alt="Failed"
                      fill
                      className="object-cover"
                    />
                  )
                }
                else {
                  return (
                    <Image 
                      src="/smile.jpg" 
                      alt="Default Smile"
                      fill
                      className="object-cover"
                    />
                  )
                }
              })()}
              
            </div>
          </div>
          
        </Card>
      </div>
    </div>
  );
}

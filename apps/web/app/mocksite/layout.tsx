import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import NavigationMenuDemo from './components/navbar'

export default function Layout({children}: {children: React.ReactNode}){
  return(
    <div className="flex h-screen w-screen flex-row bg-black justify-start">
      <div className="flex w-screen h-fit justify-center p-[1vh]">
        <NavigationMenuDemo></NavigationMenuDemo>
      </div>
    </div>

  )
}

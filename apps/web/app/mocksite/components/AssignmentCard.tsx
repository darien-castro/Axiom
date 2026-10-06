import { cn } from "@/lib/utils" 
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AssignmentCardMembers {
  classID: string
  description: string
  affect: string
  time: string
  badgeText: string
  badgeVariant?: "default" | "destructive" | "outline" | "secondary"
  className?: string
  duedate: string
} 

export default function AssignmentCard({classID, description, affect, time, badgeText, badgeVariant, className, duedate, ...props }: AssignmentCardMembers) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>
        {classID} 
        </CardTitle>
        <CardDescription>
        {description}
        </CardDescription>
      </CardHeader>
        <CardContent>
        <div className="flex flex-row gap-20">
        <div>
          <ul>
            <li>{affect} of overall grade</li>
            <li>{time}</li>
          </ul>
        </div>
        <div className="flex flex-end w-fit h-fill flex-end justify-end items-end">
          <p>due tuesday 27th</p>
        </div>
        </div>
        </CardContent>
      <CardFooter>
          <Badge variant={badgeVariant}>
          {badgeText}
          </Badge>
      </CardFooter>
    </Card>
  )
}

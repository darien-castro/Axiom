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
} 

export default function AssignmentCard({classID, description, affect, time, badgeText, badgeVariant, className, ...props }: AssignmentCardMembers) {
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
        <ul>
          <li>{affect} of overall grade</li>
          <li>{time}</li>
        </ul>
      </CardContent>
      <CardFooter>
          <Badge variant={badgeVariant}>
          {badgeText}
          </Badge>
      </CardFooter>
    </Card>
  )
}

import AssignmentCard from './components/AssignmentCard'
import ChartAreaInteractive from './components/mockChart'
import PhysicsView from './components/physicsview.tsx'

const MOCK_ASSIGNMENTS = [
  { classID: "ITSC 2081", description: "Architecture Lab", affect: "Affect 5%", time: "5 Hours", badgeText: "Heavy", badgeVariant: "destructive", duedate: "tuesday 27th" as const },
  { classID: "MATH 1241", description: "Calculus Homework 3", affect: "Affect 2%", time: "50 Minutes", badgeText: "Light", badgeVariant: "secondary",duedate: "tuesday 27th" as const },
  { classID: "ENGL 1102", description: "Rhetorical Analysis Essay", affect: "Affect 15%", time: "6 Hours", badgeText: "Heavy", badgeVariant: "destructive" as const },
  { classID: "PHYS 2101", description: "Kinematics Quiz", affect: "Affect 10%", time: "45 Minutes", badgeText: "Medium", badgeVariant: "default" as const },
  { classID: "HIST 1151", description: "Chapter 4 Reading", affect: "Affect 1%", time: "30 Minutes", badgeText: "Light", badgeVariant: "secondary" as const },
  { classID: "COMP 3181", description: "Binary Search Tree Project", affect: "Affect 20%", time: "8 Hours", badgeText: "Heavy", badgeVariant: "destructive" as const },
  { classID: "CHEM 1251", description: "Lab 2: Titration", affect: "Affect 5%", time: "3 Hours", badgeText: "Medium", badgeVariant: "default" as const },
  { classID: "COMM 2105", description: "Group Presentation Prep", affect: "Affect 10%", time: "2 Hours", badgeText: "Medium", badgeVariant: "default" as const },
  { classID: "ITSC 2081", description: "Midterm Review", affect: "Affect 0%", time: "1 Hour", badgeText: "Optional", badgeVariant: "outline" as const },
  { classID: "MATH 1241", description: "Integration Practice", affect: "Affect 2%", time: "40 Minutes", badgeText: "Light", badgeVariant: "secondary" as const },
  { classID: "STAT 2122", description: "Probability Problem Set", affect: "Affect 4%", time: "1.5 Hours", badgeText: "Medium", badgeVariant: "default" as const },
  { classID: "PHIL 1101", description: "Discussion Board Post", affect: "Affect 2%", time: "20 Minutes", badgeText: "Light", badgeVariant: "secondary" as const },
  { classID: "BIOL 1110", description: "Cell Structure Quiz", affect: "Affect 5%", time: "30 Minutes", badgeText: "Medium", badgeVariant: "default" as const },
  { classID: "ART 1105", description: "Sketchbook Submission", affect: "Affect 8%", time: "4 Hours", badgeText: "Heavy", badgeVariant: "destructive" as const },
  { classID: "ECON 2101", description: "Supply & Demand Graphing", affect: "Affect 3%", time: "1 Hour", badgeText: "Medium", badgeVariant: "default" as const },
  { classID: "SPAN 1201", description: "Oral Exam Recording", affect: "Affect 10%", time: "45 Minutes", badgeText: "Heavy", badgeVariant: "destructive" as const },
  { classID: "PSYC 1101", description: "Research Participation", affect: "Affect 2%", time: "1 Hour", badgeText: "Light", badgeVariant: "secondary" as const },
  { classID: "GEOG 1105", description: "Map Identification", affect: "Affect 5%", time: "40 Minutes", badgeText: "Medium", badgeVariant: "default" as const },
  { classID: "COMP 3181", description: "Midterm Exam", affect: "Affect 25%", time: "2 Hours", badgeText: "Heavy", badgeVariant: "destructive" as const },
  { classID: "PHYS 2101", description: "Lab Report 1", affect: "Affect 8%", time: "3 Hours", badgeText: "Medium", badgeVariant: "default" as const },
];

export default function Page() {
  return (
    <div className="flex w-full justify-around bg-background mt-5">
      <div className="flex flex-row w-[90vw] h-[90vh] gap-10 justify-center items-center rounded-2xl">
        
        <div className="flex flex-col w-[30%] h-[90%] max-h-[90%] rounded-2xl border border-border bg-card/40 p-8 shadow-sm overflow-y-auto gap-6 no-scrollbar"> 
          
          {MOCK_ASSIGNMENTS.map((assignment, index) => (
            <AssignmentCard 
              key={index}
              classID={assignment.classID}
              description={assignment.description}
              affect={assignment.affect}
              time={assignment.time}
              badgeText={assignment.badgeText}
              badgeVariant={assignment.badgeVariant}
              className="shrink-0 shadow-lg hover:scale-105 transition-transform" 
            />
          ))}

        </div>

        <div className="flex flex-col w-[65%] h-[90%] rounded-2xl border border-border bg-card/40 p-6 shadow-sm">
          <div>
            <ChartAreaInteractive></ChartAreaInteractive>
          </div>
          <div className="flex justify-center items-center bg-black rounded-2xl mt-5 h-full w-full">
            <PhysicsView className="w-full h-full"></PhysicsView>

          </div>
        </div>

      </div>
    </div>
  );
}

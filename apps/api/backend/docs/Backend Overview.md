Overview of documentation here...\
## Introduction
---
Axioms back-end uses Next.js to build an callable server API from the front-end so information on Users, Canvas, and operations can be performed and sent over.

We can split the back-end into it's 4 major parts:

* Canvas Client (Incoming Data)
	* It's job is to gather information from canvas and send to wherever necessary
* Database & it's helpers (Storing Data)
	* The job of this portion of the backend is to create a database, store information and retreive information when necessary
* Data Computation
	* This includes any relational formulas we apply to information gathered about Schools/Classes/Users
* API Routes (Sending Data)
	* The job of these routes are to transport information from the server to some frontend efficiently.


## Table of Contents
---

#### Incoming Data
* [[Canvas Client|Canvas Client]]

#### Storing Data
* [[Data Mapper|Data Mapper]]
* [[Cryptography|Cryptography]]
* [[UNCC/Fall26/Software Engineering/Projects/Axiom/Backend/Documentation/Database|Database]]

#### Computing Data
* 

#### Outgoing Data
* [[Routes API|API Routes]]

##### etc.
* [[Getting Set Up]]
* [[Using Environment Variables]]
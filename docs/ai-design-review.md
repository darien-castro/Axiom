# Ai Design Review

AI was used with help after structure was build during this project, meaning classes and design was created initially, and AI helped completing the idea that was created. 
This is true for both Frontend and Backend design and creation.

# Specific Examples of correcting AI


### When helping with Crypto.ts

* We opted for using Copilot for the help of creating the Crypto library in Axiom, and when it began filling out the file it created a much less optimized version than necessary.
In fact, it wrote only 12 lines of code

```
import { createHash } from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const secretKey: string | undefined = process.env.HASH_KEY;

export function sha256(content: string | number | Buffer): Buffer {
  return createHash('sha256').update(String(content)).digest();
}
export default { sha256 };
```
* This was much less than we anticipated for and had to optimize for efficient data entry and retrieval for safety.


### When Helping with Frontend

* When creating the Frontend with Copilot and Figma, we explicitly asked to create with the backend, citing specific files to use so that it understood what goes where etc.
Rather than using the backend server to ask for information, it decided to try and edit the files to ask for data without sending to the db for some reason (editing some of the databaseClient function calls out).

* We had to make sure that we retied the database back into all the client calls so that we saved data.


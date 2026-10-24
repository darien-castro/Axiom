// api route helpers
import { CanvasClient, Canvas_API } from '../client/canvasclient';
import db, { UserInfo } from './databaseService'
import mapper from '../mapper/mapper'

export async function userRequestedmeRoute(apiKey: string): Promise<UserInfo | null> {
  const canvasClientInstance = new CanvasClient('https://instructure.charlotte.edu');
  try {
    // TODO sessions: encrypt api key here using encryption method (probably using other crypto/session service)
    //
    const validKey = await canvasClientInstance.verifyKey(apiKey);

    if (validKey === true) {

      const lastUpdate: Date | null = await  db.lastUpdated(apiKey) // encrypt
      const now: Date = new Date()
      if (isGreaterThan20MinsApart(now, lastUpdate)) {
        console.log("Greater than 20 mins")
        // get from canvas then push to db
        const me = await canvasClientInstance.GetUserInformation();
        const cleanMe = mapper.cleanUserInformation(me);
        const userInfo: UserInfo = {
          userID: apiKey, // TODO encrypt
          firstName: cleanMe.firstName,
          lastName: cleanMe.lastName
        };

        await db.pushGeneralUserInfo(userInfo);
        await db.syncUpdate(apiKey); // TODO encrypt
        return userInfo;
      }
      else {
        // less than 20 minutes old
        // get from db
        try {
        const userInfo = await db.getUserInfo(apiKey) // TODO encrypted key
        return userInfo;
        }
        catch (error) {
          throw error;
        }
      }

    }
    else {
      return null;
  }
  } catch (error) {
    throw error;
  }
}


export default {userRequestedmeRoute}

function isGreaterThan20MinsApart(date1: Date | null, date2: Date | null): boolean {
  if (date1 == null || date2 == null) {
    return true;
  }
  const TWENTY_MINUTES_IN_MS = 20 * 60 * 1000;
  const diffInMs = Math.abs(date1.getTime() - date2.getTime());
  return diffInMs > TWENTY_MINUTES_IN_MS;
}

import dbtest from './databaseService'

async function test() {
  await dbtest.initAllTables();
}
test();

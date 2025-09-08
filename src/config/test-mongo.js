const { MongoClient } = require('mongodb')

const uri = 'mongodb+srv://vieque:21002341%401901@fortunas.dgnex0n.mongodb.net/FS?retryWrites=true&w=majority&appName=FortunaS';

const client = new MongoClient(uri)

async function run() {
  try {
    await client.connect()
    console.log('✅ Connected with native MongoDB driver!')
    const db = client.db('FS')
    const collections = await db.listCollections().toArray()
    console.log('📂 Collections:', collections.map(c => c.name))
  } catch (err) {
    console.error('❌ Native driver error:', err)
  } finally {
    await client.close()
  }
}

run();

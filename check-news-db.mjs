import { db } from "./lib/db.js"
import { news } from "./lib/db/schema.js"
import { eq, desc } from "drizzle-orm"

async function checkNewsInDatabase() {
  try {
    console.log('🔍 Checking news items in database...\n')
    
    // Check all news items
    const allNews = await db.select().from(news).orderBy(desc(news.createdAt))
    console.log(`📊 Total news items in database: ${allNews.length}`)
    
    if (allNews.length > 0) {
      console.log('\n📰 All news items:')
      allNews.forEach((item, index) => {
        console.log(`${index + 1}. "${item.title}" - Published: ${item.isPublished ? 'YES' : 'NO'} - Date: ${item.publishedAt || 'No date'}`)
      })
    }
    
    // Check published news items
    const publishedNews = await db.select().from(news).where(eq(news.isPublished, true)).orderBy(desc(news.publishedAt))
    console.log(`\n✅ Published news items: ${publishedNews.length}`)
    
    if (publishedNews.length > 0) {
      console.log('\n📰 Published news items:')
      publishedNews.forEach((item, index) => {
        console.log(`${index + 1}. "${item.title}" - Published at: ${item.publishedAt}`)
      })
    } else {
      console.log('\n❌ No published news items found!')
      console.log('   This is why news doesn\'t appear on the frontend.')
      console.log('   Solution: Create news items and ensure they are marked as published.')
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message)
    console.log('   Make sure the database is connected and the news table exists.')
  }
}

checkNewsInDatabase()
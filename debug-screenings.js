import { db, sql } from './lib/db/index.js';

(async () => {
  try {
    // Check submissions and their statuses
    const submissions = await sql`
      SELECT s.id, s.status, s.created_at, s.updated_at, a.title, u.name as author_name, u.email as author_email
      FROM submissions s
      LEFT JOIN articles a ON s.article_id = a.id  
      LEFT JOIN users u ON s.author_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `;
    
    console.log('=== SUBMISSIONS STATUS ===');
    console.log(JSON.stringify(submissions, null, 2));
    
    // Check manuscript_screenings table
    const screenings = await sql`
      SELECT ms.*, s.status as submission_status
      FROM manuscript_screenings ms
      LEFT JOIN submissions s ON ms.manuscript_id = s.id
      ORDER BY ms.created_at DESC
      LIMIT 10
    `;
    
    console.log('\n=== MANUSCRIPT SCREENINGS ===');
    console.log(JSON.stringify(screenings, null, 2));
    
    // Check notifications table
    const notifications = await sql`
      SELECT n.*, u.email as user_email
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.type LIKE '%SCREENING%' OR n.type LIKE '%screening%'
      ORDER BY n.created_at DESC
      LIMIT 10
    `;
    
    console.log('\n=== SCREENING NOTIFICATIONS ===');
    console.log(JSON.stringify(notifications, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
})();
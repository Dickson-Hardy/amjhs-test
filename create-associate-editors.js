import postgres from 'postgres'

const DATABASE_URL = "postgresql://neondb_owner:npg_gifD5p1lIBTc@ep-fragrant-bonus-abz6h9us-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

const sql = postgres(DATABASE_URL, {
  ssl: 'require'
});

async function createAssociateEditors() {
  try {
    console.log('🔧 Creating associate editors from existing editors...');
    
    // Get some existing editors to convert to associate editors
    const editors = await sql`
      SELECT id, name, email 
      FROM users 
      WHERE role = 'editor'
      ORDER BY name
      LIMIT 3;
    `;
    
    console.log(`Found ${editors.length} editor(s) to convert:`);
    
    if (editors.length > 0) {
      // Convert first 2-3 editors to associate editors
      const editorIdsToConvert = editors.slice(0, 2).map(e => e.id);
      
      await sql`
        UPDATE users 
        SET role = 'associate-editor' 
        WHERE id = ANY(${editorIdsToConvert});
      `;
      
      console.log('✅ Converted editors to associate editors:');
      editors.slice(0, 2).forEach(editor => {
        console.log(`  - ${editor.name} (${editor.email})`);
      });
      
      // Verify the update
      const newAssociateEditors = await sql`
        SELECT id, name, email, role 
        FROM users 
        WHERE role = 'associate-editor'
        ORDER BY name;
      `;
      
      console.log(`\n✅ Now have ${newAssociateEditors.length} associate editor(s):`);
      newAssociateEditors.forEach(editor => {
        console.log(`  - ${editor.name} (${editor.email})`);
      });
    } else {
      console.log('❌ No editors found to convert');
    }
    
  } catch (error) {
    console.error('❌ Error creating associate editors:', error);
  } finally {
    await sql.end();
  }
}

createAssociateEditors();
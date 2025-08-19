import db, { queries } from '../dist/database.js';

// Seed initial data
function seedDatabase() {
  console.log( 'Seeding database...' );
  
  try {
    // Insert default settings
    queries.setSetting.run( 'app_name', 'TileDash' );
    queries.setSetting.run( 'version', '1.0.0' );
    queries.setSetting.run( 'theme', 'tiledash' );
    
    // Insert demo dashboard config
    const demoDashboardConfig = JSON.stringify( {
      settings: {
        tileSize: 80,
        tileMargin: 5,
        groupMargin: 10,
        orientation: 'landscape',
        customText: 'Demo Dashboard',
        dateLocal: 'en-EN',
        iconSize: 40,
        numOfLandImg: 4,
        numOfPortImg: 5
      },
      dashboard: [
        {
          icon: 'mdi-home',
          group: [
            {
              title: 'Demo Group',
              width: 4,
              height: 6,
              items: [
                {
                  position: [0, 0],
                  type: 'VIRTUAL',
                  width: 2,
                  height: 2,
                  icon: 'mdi-lightbulb',
                  name: 'Demo Light'
                }
              ]
            }
          ]
        }
      ]
    } );
    
    queries.saveDashboardConfig.run( 'demo', demoDashboardConfig, 1 );
    queries.setActiveDashboard.run( 'demo' );
    
    console.log( 'Database seeded successfully!' );
  } catch ( error ) {
    console.error( 'Error seeding database:', error );
  } finally {
    db.close();
  }
}

seedDatabase();

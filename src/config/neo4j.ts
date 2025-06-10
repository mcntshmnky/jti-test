// Neo4j Configuration
// Choose either LOCAL or AURA configuration and comment out the other

// LOCAL NEO4J CONFIGURATION
export const NEO4J_CONFIG = {
    // Local Neo4j Desktop configuration
    uri: 'bolt://localhost:7687',
    user: 'neo4j',
    password: 'masterpass', // Replace this with the password you set during Neo4j Desktop installation
    database: 'JTI-emotional-test'
};

// AURA NEO4J CONFIGURATION
// export const NEO4J_CONFIG = {
//     // For Neo4j Aura cloud service
//     uri: 'neo4j+s://your-instance-id.databases.neo4j.io:7687', // Replace with your Aura URI
//     user: 'neo4j',
//     password: 'your-password-here', // Replace with your Aura password
//     database: 'neo4j'
// }; 
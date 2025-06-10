import neo4j, { Driver, Session } from 'neo4j-driver';
import { NEO4J_CONFIG } from '../config/neo4j';

class Neo4jService {
    private static instance: Neo4jService;
    private driver: Driver | null = null;
    private isInitializing: boolean = false;

    private constructor() {}

    public static getInstance(): Neo4jService {
        if (!Neo4jService.instance) {
            Neo4jService.instance = new Neo4jService();
        }
        return Neo4jService.instance;
    }

    private async initializeDriver(): Promise<Driver> {
        if (this.driver) {
            return this.driver;
        }

        if (this.isInitializing) {
            // Wait for initialization to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.initializeDriver();
        }

        this.isInitializing = true;
        try {
            this.driver = neo4j.driver(
                NEO4J_CONFIG.uri,
                neo4j.auth.basic(NEO4J_CONFIG.user, NEO4J_CONFIG.password),
                {
                    maxConnectionLifetime: 3600000, // 1 hour
                    maxConnectionPoolSize: 50,
                    connectionAcquisitionTimeout: 30000, // 30 seconds
                }
            );

            // Verify the connection
            const session = this.driver.session();
            try {
                await session.run('RETURN 1');
            } finally {
                await session.close();
            }

            return this.driver;
        } finally {
            this.isInitializing = false;
        }
    }

    async getSession(): Promise<Session> {
        const driver = await this.initializeDriver();
        return driver.session({
            database: NEO4J_CONFIG.database
        });
    }

    async listDatabases(): Promise<string[]> {
        const session = await this.getSession();
        try {
            const result = await session.run('SHOW DATABASES');
            return result.records.map(record => record.get('name'));
        } finally {
            await session.close();
        }
    }

    async createDatabase(name: string): Promise<void> {
        const session = await this.getSession();
        try {
            await session.run(`CREATE DATABASE ${name}`);
        } finally {
            await session.close();
        }
    }

    async getGraphData() {
        const session = await this.getSession();
        try {
            const result = await session.run(`
                MATCH (n)
                OPTIONAL MATCH (n)-[r]->(m)
                RETURN n, r, m
                LIMIT 100
            `);
            
            return result.records.map(record => ({
                nodes: [record.get('n'), record.get('m')].filter(Boolean),
                relationships: [record.get('r')].filter(Boolean)
            }));
        } finally {
            await session.close();
        }
    }

    async createSampleData() {
        const session = await this.getSession();
        try {
            // Clear existing data
            await session.run('MATCH (n) DETACH DELETE n');

            // Create emotional states
            await session.run(`
                CREATE (happiness:Emotion {name: 'Happiness', intensity: 0.8})
                CREATE (sadness:Emotion {name: 'Sadness', intensity: 0.6})
                CREATE (anger:Emotion {name: 'Anger', intensity: 0.7})
                CREATE (fear:Emotion {name: 'Fear', intensity: 0.5})
                CREATE (love:Emotion {name: 'Love', intensity: 0.9})
                
                // Create triggers
                CREATE (success:Trigger {name: 'Success', type: 'Positive'})
                CREATE (loss:Trigger {name: 'Loss', type: 'Negative'})
                CREATE (threat:Trigger {name: 'Threat', type: 'Negative'})
                CREATE (connection:Trigger {name: 'Connection', type: 'Positive'})
                
                // Create relationships
                CREATE (success)-[:TRIGGERS {weight: 0.8}]->(happiness)
                CREATE (loss)-[:TRIGGERS {weight: 0.7}]->(sadness)
                CREATE (threat)-[:TRIGGERS {weight: 0.6}]->(fear)
                CREATE (threat)-[:TRIGGERS {weight: 0.5}]->(anger)
                CREATE (connection)-[:TRIGGERS {weight: 0.9}]->(love)
                
                // Create emotional connections
                CREATE (happiness)-[:RELATES_TO {type: 'opposite'}]->(sadness)
                CREATE (anger)-[:RELATES_TO {type: 'related'}]->(fear)
                CREATE (love)-[:RELATES_TO {type: 'enhances'}]->(happiness)
            `);
        } finally {
            await session.close();
        }
    }

    async close() {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
        }
    }
}

export const neo4jService = Neo4jService.getInstance(); 
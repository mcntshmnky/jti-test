import React, { useEffect, useState } from 'react';
import { neo4jService } from '../services/neo4jService';
import { NEO4J_CONFIG } from '../config/neo4j';

const ConnectionTest: React.FC = () => {
    const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
    const [message, setMessage] = useState<string>('Testing connection...');
    const [details, setDetails] = useState<string[]>([]);

    useEffect(() => {
        const testConnection = async () => {
            try {
                setStatus('checking');
                setMessage('Testing connection...');
                setDetails([]);

                // Display current configuration
                setDetails(prev => [
                    ...prev,
                    `Current Configuration:`,
                    `URI: ${NEO4J_CONFIG.uri}`,
                    `User: ${NEO4J_CONFIG.user}`,
                    `Database: ${NEO4J_CONFIG.database}`
                ]);

                // List available databases
                const databases = await neo4jService.listDatabases();
                setDetails(prev => [...prev, `Available databases: ${databases.join(', ')}`]);

                // Check if emotional database exists
                if (!databases.includes('emotional')) {
                    setDetails(prev => [...prev, 'Database "emotional" not found, attempting to create...']);
                    try {
                        await neo4jService.createDatabase('emotional');
                        setDetails(prev => [...prev, 'Successfully created "emotional" database']);
                    } catch (error: any) {
                        setDetails(prev => [...prev, `Failed to create database: ${error.message}`]);
                        throw error;
                    }
                }

                // Test connection with a simple query
                const session = await neo4jService.getSession();
                try {
                    await session.run('RETURN 1');
                    setStatus('connected');
                    setMessage('Successfully connected to Neo4j!');
                    setDetails(prev => [...prev, 'Connection test query successful']);
                } finally {
                    await session.close();
                }
            } catch (error: any) {
                setStatus('error');
                let errorMessage = 'Connection failed';
                
                if (error.message.includes('ECONNREFUSED')) {
                    errorMessage += ': Could not connect to Neo4j. Please ensure Neo4j Desktop is running.';
                } else if (error.message.includes('authentication failure')) {
                    errorMessage += ': Authentication failed. Please check your credentials.';
                } else if (error.message.includes('Pool is closed')) {
                    errorMessage += ': Connection pool was closed. Please refresh the page.';
                } else {
                    errorMessage += `: ${error.message}`;
                }
                
                setMessage(errorMessage);
                setDetails(prev => [...prev, `Error details: ${error.message}`]);
            }
        };

        testConnection();

        // Cleanup function
        return () => {
            neo4jService.close();
        };
    }, []);

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Neo4j Connection Test</h2>
            <div className={`p-4 rounded ${
                status === 'checking' ? 'bg-yellow-100' :
                status === 'connected' ? 'bg-green-100' : 'bg-red-100'
            }`}>
                <p className="font-semibold">{message}</p>
                {details.length > 0 && (
                    <ul className="mt-2 list-disc list-inside">
                        {details.map((detail, index) => (
                            <li key={index} className="text-sm">{detail}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ConnectionTest; 
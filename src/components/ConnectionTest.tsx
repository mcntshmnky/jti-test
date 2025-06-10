import React, { useEffect, useState } from 'react';
import { neo4jService } from '../services/neo4jService';

const ConnectionTest: React.FC = () => {
    const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
    const [message, setMessage] = useState('Testing connection...');
    const [details, setDetails] = useState<string[]>([]);

    useEffect(() => {
        const testConnection = async () => {
            try {
                // First, try to list all databases
                const databases = await neo4jService.listDatabases();
                setDetails(prev => [...prev, `Available databases: ${databases.join(', ')}`]);

                // Check if our database exists
                if (!databases.includes('emotional')) {
                    setDetails(prev => [...prev, 'Database "emotional" not found. Attempting to create it...']);
                    try {
                        await neo4jService.createDatabase('emotional');
                        setDetails(prev => [...prev, 'Database "emotional" created successfully']);
                    } catch (createError) {
                        setStatus('error');
                        setMessage('Failed to create database. Please create it manually in Neo4j Desktop.');
                        setDetails(prev => [...prev, `Error creating database: ${createError instanceof Error ? createError.message : 'Unknown error'}`]);
                        return;
                    }
                }

                // Try to create sample data
                await neo4jService.createSampleData();
                setStatus('success');
                setMessage('Successfully connected to Neo4j and created sample data!');
                setDetails(prev => [...prev, 'Sample data created successfully']);
            } catch (error) {
                setStatus('error');
                if (error instanceof Error) {
                    if (error.message.includes('ECONNREFUSED')) {
                        setMessage('Connection refused. Please make sure Neo4j Desktop is running and the database is started.');
                        setDetails(prev => [...prev, 'Check if Neo4j Desktop is running', 'Check if the database is started']);
                    } else if (error.message.includes('authentication')) {
                        setMessage('Authentication failed. Please check your password in neo4j.ts');
                        setDetails(prev => [...prev, 'Verify the password in src/config/neo4j.ts']);
                    } else {
                        setMessage(`Connection failed: ${error.message}`);
                        setDetails(prev => [...prev, `Error details: ${error.message}`]);
                    }
                }
            }
        };

        testConnection();
    }, []);

    return (
        <div style={{
            padding: '1rem',
            margin: '1rem 0',
            borderRadius: '4px',
            backgroundColor: status === 'testing' ? '#f0f0f0' : 
                           status === 'success' ? '#e6ffe6' : '#ffe6e6',
            color: status === 'testing' ? '#666' : 
                  status === 'success' ? '#006600' : '#cc0000'
        }}>
            <div style={{ marginBottom: '0.5rem' }}>{message}</div>
            {details.length > 0 && (
                <div style={{ 
                    fontSize: '0.9em', 
                    marginTop: '0.5rem',
                    textAlign: 'left',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: '4px'
                }}>
                    {details.map((detail, index) => (
                        <div key={index} style={{ marginBottom: '0.25rem' }}>{detail}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ConnectionTest; 
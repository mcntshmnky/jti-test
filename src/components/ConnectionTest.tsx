import React, { useEffect, useState } from 'react';
import { neo4jService } from '../services/neo4jService';

const ConnectionTest: React.FC = () => {
    const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
    const [message, setMessage] = useState('Testing connection...');

    useEffect(() => {
        const testConnection = async () => {
            try {
                // First, try to verify the database exists
                const session = neo4jService.getSession();
                try {
                    await session.run('SHOW DATABASE emotional');
                } catch (dbError) {
                    setStatus('error');
                    setMessage('Database "emotional" not found. Please create it in Neo4j Desktop first.');
                    return;
                }

                // If database exists, try to create sample data
                await neo4jService.createSampleData();
                setStatus('success');
                setMessage('Successfully connected to Neo4j and created sample data!');
            } catch (error) {
                setStatus('error');
                if (error instanceof Error) {
                    if (error.message.includes('ECONNREFUSED')) {
                        setMessage('Connection refused. Please make sure Neo4j Desktop is running and the database is started.');
                    } else if (error.message.includes('authentication')) {
                        setMessage('Authentication failed. Please check your password in neo4j.ts');
                    } else {
                        setMessage(`Connection failed: ${error.message}`);
                    }
                } else {
                    setMessage('Unknown error occurred');
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
            {message}
        </div>
    );
};

export default ConnectionTest; 
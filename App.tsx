
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { FileUpload } from './components/FileUpload.tsx';
import { ManualEntry } from './components/ManualEntry.tsx';
import { Results } from './components/Results.tsx';
import { Login } from './components/Login.tsx';
import type { LineItemClassification, TransactionType } from './types.ts';
import { classifyCommodity } from './services/geminiService.ts';
import { Search, ShieldAlert, KeyRound } from 'lucide-react';

const ApiKeySelector: React.FC<{ onSelectKey: () => void }> = ({ onSelectKey }) => (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="text-center max-w-2xl p-8 bg-bg-card border border-border-color rounded-xl shadow-2xl shadow-primary/10">
            <ShieldAlert className="mx-auto h-16 w-16 text-warning mb-4" />
            <h2 className="text-3xl font-bold text-primary mb-4">API Key Required</h2>
            <p className="text-text-secondary mb-6">
                To use the BORDERLOGIX HS Engine, you need to select a valid API key from a paid Google Cloud project. This ensures secure and reliable access to the AI models.
            </p>
            <p className="text-sm text-text-secondary mb-8">
                For more information on billing, please visit the{' '}
                <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline font-semibold"
                >
                    official documentation
                </a>.
            </p>
            <button
                onClick={onSelectKey}
                className="btn inline-flex items-center gap-2 bg-gradient-to-br from-primary to-primary-dark text-white font-semibold py-3 px-10 rounded-lg text-lg hover:shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-300"
            >
                <KeyRound size={20} />
                Select API Key
            </button>
        </div>
    </div>
);

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [itemDescription, setItemDescription] = useState('');
    const [countryOrigin, setCountryOrigin] = useState('');
    const [transactionType, setTransactionType] = useState<TransactionType>('import');
    
    const [isLoading, setIsLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [classificationResult, setClassificationResult] = useState<LineItemClassification[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isApiKeyReady, setIsApiKeyReady] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;
        const checkApiKey = async () => {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setIsApiKeyReady(true);
            }
        };
        checkApiKey();
    }, [isAuthenticated]);

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            // Assume success after opening dialog to handle race conditions
            setIsApiKeyReady(true);
        } catch (e) {
            console.error("Failed to open API key selection:", e);
        }
    };

    const handleClassify = useCallback(async () => {
        if (!itemDescription && uploadedFiles.length === 0) {
            alert('Please provide an item description or upload documents.');
            return;
        }

        setIsLoading(true);
        setClassificationResult(null);
        setError(null);
        
        const stages = [
            'Analyzing commodity description...',
            'Checking for exclusionary notes...',
            'Applying GIR rules in sequence...',
            'Referencing PNG 2022 Tariff Schedule...',
            'Identifying regulatory flags...',
            'Generating legal justification...',
            'Finalizing compliance report...'
        ];

        try {
            for (const stage of stages) {
                setStatusText(stage);
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            const result = await classifyCommodity({
                description: itemDescription,
                country: countryOrigin,
                transactionType,
                files: uploadedFiles,
            });

            setClassificationResult(result);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('API key not valid') || errorMessage.includes('Requested entity was not found.')) {
                setIsApiKeyReady(false);
            }
        } finally {
            setIsLoading(false);
        }
    }, [itemDescription, countryOrigin, transactionType, uploadedFiles]);

    if (!isAuthenticated) {
        return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="relative min-h-screen overflow-x-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,rgba(0,168,107,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,168,107,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                {!isApiKeyReady ? (
                    <ApiKeySelector onSelectKey={handleSelectKey} />
                ) : (
                    <>
                        <Header />
                        <main>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                <FileUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
                                <ManualEntry 
                                    itemDescription={itemDescription}
                                    onItemDescriptionChange={setItemDescription}
                                    countryOrigin={countryOrigin}
                                    onCountryOriginChange={setCountryOrigin}
                                    transactionType={transactionType}
                                    onTransactionTypeChange={setTransactionType}
                                />
                            </div>

                            <div className="text-center">
                                <button 
                                    className="btn inline-flex items-center gap-2 bg-gradient-to-br from-primary to-primary-dark text-white font-semibold py-4 px-12 rounded-lg text-lg hover:shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleClassify}
                                    disabled={isLoading}
                                >
                                    <Search size={20} />
                                    CLASSIFY COMMODITY
                                </button>
                            </div>

                            {isLoading && (
                                <div className="text-center my-8">
                                    <div className="spinner w-10 h-10 border-4 border-t-primary border-border-color rounded-full animate-spin mx-auto"></div>
                                    <p className="mt-4 text-text-secondary">
                                        <span className="status-badge inline-block px-4 py-2 rounded-full bg-warning/20 text-warning">{statusText}</span>
                                    </p>
                                </div>
                            )}
                            
                            {error && (
                                 <div className="my-8 p-4 bg-error/20 border border-error text-error rounded-lg text-center">
                                    <h3 className="font-bold">Classification Failed</h3>
                                    <p>{error}</p>
                                </div>
                            )}

                            {classificationResult && (
                                <Results result={classificationResult} />
                            )}
                        </main>
                    </>
                )}
            </div>
        </div>
    );
};

export default App;

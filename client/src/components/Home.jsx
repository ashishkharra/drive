import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gapi } from 'gapi-script';
import { userAuth } from './Store';
import Loading from './Loading';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState('');
    const [drafts, setDrafts] = useState([]);
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [showDrafts, setShowDrafts] = useState(false);
    const textAreaRef = useRef(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [gapiReady, setGapiReady] = useState(false);
    let folderId = null;

    const saveDraft = () => {
        const newDraft = {
            id: Date.now(),
            content,
            timestamp: new Date().toLocaleString(),
        };

        const updatedDrafts = [...drafts, newDraft];
        setDrafts(updatedDrafts);
        localStorage.setItem('drafts', JSON.stringify(updatedDrafts));
        alert('Draft saved!');
    };

    useEffect(() => {
        const storedDrafts = JSON.parse(localStorage.getItem('drafts')) || [];
        setDrafts(storedDrafts);
    }, []);

    const toggleFormat = (format) => {
        if (format === 'bold') {
            setIsBold((prev) => !prev);
        } else if (format === 'italic') {
            setIsItalic((prev) => !prev);
        } else if (format === 'underline') {
            setIsUnderline((prev) => !prev);
        }
    };

    const loadDraft = (draftId) => {
        const draft = drafts.find(d => d.id === draftId);
        if (draft) {
            setContent(draft.content);
            setSelectedDraft(draft);
        }
    };

    const deleteDraft = (draftId) => {
        setDrafts(drafts.filter(draft => draft.id !== draftId));
        setContent('')
    };



    // Initialize Google APIs
    useEffect(() => {
        const initGapi = async () => {
            try {
                await new Promise((resolve) => gapi.load('client:auth2', resolve));

                await gapi.client.init({
                    apiKey: import.meta.env.VITE_API_KEY,
                    clientId: import.meta.env.VITE_CLIENT_ID,
                    discoveryDocs: [
                        "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
                        "https://www.googleapis.com/discovery/v1/apis/docs/v1/rest"
                    ],
                    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents'
                });

                const auth = gapi.auth2.getAuthInstance();
                setIsAuthenticated(auth.isSignedIn.get());
                auth.isSignedIn.listen(setIsAuthenticated);

                // Now explicitly check if gapi.client exists
                if (gapi.client && gapi.client.drive && gapi.client.docs) {
                    console.log("Google API Client Loaded Successfully");
                    setGapiReady(true);
                } else {
                    console.error("Google API Client failed to initialize.");
                }
            } catch (error) {
                console.error('Google API Initialization Error:', error);
            }
        };

        // Ensure gapi is defined before initializing
        if (window.gapi) {
            initGapi();
        } else {
            console.error("gapi is not available on window. Check if the Google API script is loaded.");
        }
    }, []);

    useEffect(() => {
        console.log("Google API Ready:", gapiReady);
        console.log("gapi.client:", gapi.client);
    }, [gapiReady]);


    const handleAuthClick = async () => {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signIn();
            setIsAuthenticated(authInstance.isSignedIn.get());
        } catch (error) {
            console.error("Error during authentication:", error);
        }
    };

    const saveToDrive = async () => {
        if (!gapiReady) {
            alert('Google APIs are still loading. Please try again in a moment.');
            return;
        }

        if (!isAuthenticated) {
            await handleAuthClick();
            return;
        }

        setIsSaving(true);

        try {
            // Step 1: Check if "Letters" folder exists
            const folderName = "Letters";
            const folderSearch = await gapi.client.drive.files.list({
                q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: "files(id, name)",
                supportsAllDrives: true,  // ✅ Required for Shared Drives
                includeItemsFromAllDrives: true, // ✅ Required for Shared Drives
            });

            if (folderSearch.result.files.length > 0) {
                folderId = folderSearch.result.files[0].id; // Use existing folder
            } else {
                // Step 2: Create "Letters" folder if not found
                const folderMetadata = {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder'
                };

                const folderResponse = await gapi.client.drive.files.create({
                    resource: folderMetadata,
                    fields: 'id'
                });

                folderId = folderResponse.result.id;
            }

            // Step 3: Create a new Google Doc inside the folder
            const doc = await gapi.client.docs.documents.create({
                resource: { title: `Letter_${new Date().toLocaleDateString()}` }
            });

            const docId = doc.result.documentId;

            // Step 4: Move document to "Letters" folder
            await gapi.client.drive.files.update({
                fileId: docId,
                addParents: folderId,
                removeParents: 'root', // Remove from root and move to folder
                fields: 'id, parents'
            });

            console.log(`Document moved to "${folderName}"`);

            // Step 5: Insert Text into the Document
            const requests = [
                {
                    insertText: {
                        location: { index: 1 },
                        text: content
                    }
                }
            ];

            // Step 6: Apply Formatting (if needed)
            if (content.length > 0 && (isBold || isItalic || isUnderline)) {
                requests.push({
                    updateTextStyle: {
                        range: { startIndex: 1, endIndex: content.length + 1 },
                        textStyle: {
                            bold: isBold,
                            italic: isItalic,
                            underline: isUnderline
                        },
                        fields: "bold,italic,underline"
                    }
                });
            }

            // Step 7: Send Update Request
            await gapi.client.docs.documents.batchUpdate({
                documentId: docId,
                resource: { requests }
            });

            alert('Document successfully uploaded!')


        } catch (error) {
            console.error('Save error:', error);
            alert(`Failed to save: ${error.result?.error?.message || error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await userAuth.getState().logout();
            localStorage.removeItem('userSession');
            sessionStorage.clear();

            alert('successfully log-out');
            navigate('/', {
                state: {
                    message: 'You have been logged out successfully',
                    type: 'success'
                }
            });
            return;
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen relative bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8"
        >
            {isSaving && (
                <div className='h-full w-full flex justify-center items-center absolute z-50'>
                    <AnimatePresence>
                        <Loading />
                    </AnimatePresence>
                </div>
            )}

            <div className='flex justify-around'>
                <button
                    onClick={handleLogout}
                    className="flex bg-white/10 rounded-lg backdrop-blur-sm gap-2 hover:bg-white/20 items-center px-4 py-2 transition-all"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H9m4-7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h6a2 2 0 002-2v-2" />
                    </svg>
                    Logout
                </button>

                <Link to='/your-docs' className='flex gap-2 items-center'>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        width="24"
                        height="24"
                    >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />

                        <path d="M12 13c3 0 5.5 1.7 7 3-1.5 1.3-4 3-7 3s-5.5-1.7-7-3c1.5-1.3 4-3 7-3z" />
                        <circle cx="12" cy="16" r="0.8" />
                    </svg>
                    <p>Your documents</p>
                </Link>
            </div>



            <div className={`max-w-4xl mx-auto z ${isSaving ? 'blur-sm opacity-50' : ''}`}>
                <motion.div
                    className="bg-white rounded-lg shadow-xl overflow-hidden"
                    whileHover={{ scale: 1.005 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-800">Letter Editor</h1>
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowDrafts(!showDrafts)}
                                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                            >
                                {selectedDraft ? 'Draft Saved' : 'Drafts'} ({drafts.length})
                            </motion.button>

                            <AnimatePresence>
                                {showDrafts && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border"
                                    >
                                        {drafts.map(draft => (
                                            <div key={draft.id} className="p-2 border-b hover:bg-gray-50">
                                                <div className="flex justify-between items-center">
                                                    <button
                                                        onClick={() => loadDraft(draft.id)}
                                                        className="text-left flex-1 truncate"
                                                    >
                                                        <span className="text-sm">{draft.timestamp}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteDraft(draft.id)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {drafts.length === 0 && (
                                            <p className="p-3 text-sm text-gray-500">No drafts available</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="p-6 space-y-6">
                        <div className="flex flex-wrap gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleFormat('bold')}
                                className={`px-4 py-2 rounded-md ${isBold ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Bold
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleFormat('italic')}
                                className={`px-4 py-2 rounded-md ${isItalic ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Italic
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleFormat('underline')}
                                className={`px-4 py-2 rounded-md ${isUnderline ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Underline
                            </motion.button>
                        </div>

                        <div className="h-96 resize-y min-h-[200px] max-h-[80vh] relative">
                            <textarea
                                ref={textAreaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-full p-4 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none prose max-w-none"
                                placeholder="Write your letter here..."
                                style={{
                                    fontWeight: isBold ? 'bold' : 'normal',
                                    fontStyle: isItalic ? 'italic' : 'normal',
                                    textDecoration: isUnderline ? 'underline' : 'none'
                                }}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                {content.length} characters
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={saveDraft}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg"
                            >
                                Save Draft Locally
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={saveToDrive}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg"
                            >
                                Save to Google Drive
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Home;
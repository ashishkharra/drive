import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { gapi } from "gapi-script";
import { Link, useNavigate } from "react-router-dom";
import { userAuth } from "./Store";

const AllDocs = () => {
    const allDocs = userAuth(state => state.allDocs);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [folderId, setFolderId] = useState(null);

    useEffect(() => {
        const fetchFolderId = async () => {
            try {
                const response = await gapi.client.drive.files.list({
                    q: "name='Letters' and mimeType='application/vnd.google-apps.folder'",
                    fields: "files(id)",
                });
                if (response.result.files.length > 0) {
                    const id = response.result.files[0].id;
                    setFolderId(id);
                    fetchDocs(id);
                } else {
                    setError("Letters folder not found.");
                }
            } catch (err) {
                console.error("Error fetching folder:", err);
                setError("Failed to fetch folder.");
            }
        };

        if (gapi.client && gapi.client.drive) {
            fetchFolderId();
        }
    }, []);


    const fetchDocs = async (currentFolderId) => {
        if (!currentFolderId) return;

        try {
            console.log('Fetching docs for folder');

            const response = await gapi.client.drive.files.list({
                q: `'${currentFolderId}' in parents 
                    and mimeType='application/vnd.google-apps.document' 
                    and trashed = false`,
                fields: "files(id, name, modifiedTime)",
                orderBy: "modifiedTime desc",
                spaces: 'drive'
            });

            const validDocs = response.result.files?.filter(doc =>
                !doc.name.includes('(deleted)')
            ) || [];

            console.log('Filtered docs');
            userAuth.getState().setDocs(validDocs);

        } catch (err) {
            console.error("Fetch error details:", err.result);
            setError("Failed to load documents");
        } finally {
            setLoading(false);
        }
    };

    const openEditor = (docId, content) => {
        navigate(`/update-doc/${docId}`, { state: { content } });
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-6 sm:px-10`}
        >
            <motion.p className="my-3">if document don't show then go back and click on your documents</motion.p>
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
                <h1 className="text-2xl font-semibold text-gray-800 mb-4">Your Letters</h1>
                <Link to="/editor" className="text-orange-600 hover:underline">← Back to Editor</Link>

                {loading ? (
                    <p className="text-gray-500 mt-4">Loading documents...</p>
                ) : error ? (
                    <p className="text-red-500 mt-4">{error}</p>
                ) : allDocs.length === 0 ? (
                    <p className="text-gray-500 mt-4">No letters found in the 'Letters' folder.</p>
                ) : (
                    <motion.ul
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 space-y-3"
                    >
                        {allDocs.map((doc) => (
                            <motion.li
                                key={doc.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-4 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-lg transition flex justify-between items-center"
                            >
                                <div onClick={() => openEditor(doc.id, doc.name)}>
                                    {doc.name}
                                </div>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </div>
        </motion.div>
    );
};

export default AllDocs;

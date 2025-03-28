import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";
import Loading from "./Loading";

const socket = io(import.meta.env.VITE_BACKEND_PORT);

const Editor = () => {
    const { docId } = useParams();
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowPopup(false), 500000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchDocContent = async () => {
            try {
                const response = await gapi.client.docs.documents.get({
                    documentId: docId,
                });

                const docText = response.result.body.content
                    .map((el) => el.paragraph?.elements?.map((e) => e.textRun?.content || "").join(""))
                    .join("\n");

                setContent(docText);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching document:", err);
                setLoading(false);
            }
        };

        fetchDocContent();
        socket.emit("join-document", docId);

        socket.on("load-document", (data) => setContent(data));
        socket.on("receive-changes", (updatedContent) => setContent(updatedContent));

        return () => {
            socket.emit("leave-document", docId);
        };
    }, [docId]);

    const handleChange = (e) => {
        let newContent = e.target.value;
        newContent = newContent.replace(/\n{3,}/g, "\n\n");
        setContent(newContent);
    };

    useEffect(() => {
        if (content.trim() !== "") {
            console.log("Emitting latest content:");
            debouncedSendChanges(docId, content);
        }
    }, [content]);


    const debouncedSendChanges = useCallback(
        debounce((docId, content) => {
            console.log("Emitting send-changes");
            socket.emit("send-changes", { docId, content });

        }, 1000),
        []
    );

    if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;

    return (
        <div className="w-full h-screen flex flex-col justify-center items-center">
            <h1 className="text-xl">Your Letter</h1>
            <textarea
                value={content}
                onChange={handleChange}
                className="border p-2 w-full h-[70%] sm:w-full md:w-[70%] border-black"
                placeholder="Change will be here.."
            />

            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-lg">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center border border-gray-300">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Instructions</h2>
                        <p className="text-gray-700 font-medium mb-4">Follow these steps to change your document from here this will access the only folder:</p>
                        <ul className="text-gray-600 text-left space-y-2 mb-4">
                            <li className="flex items-center space-x-2">
                                <span className="text-orange-500 font-semibold">1.</span>
                                <span>Go to Google Drive.</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <span className="text-orange-500 font-semibold">2.</span>
                                <span>Select the folder <strong>Letters</strong>.</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <span className="text-orange-500 font-semibold">3.</span>
                                <span>Right-click on it, click <strong>Share</strong>, and add this email:</span>
                            </li>
                            <li className="bg-gray-100 p-2 rounded-lg text-sm text-gray-800 font-mono border border-gray-300">
                                {import.meta.env.VITE_PERMIT}
                            </li>
                            <li className="flex items-center space-x-2">
                                <span className="text-orange-500 font-semibold">4.</span>
                                <span>Click <strong>OK</strong>, and you're all set!</span>
                            </li>
                        </ul>
                        <button
                            onClick={() => setShowPopup(false)}
                            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Editor;

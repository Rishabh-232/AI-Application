import React, { useState } from 'react';

export default function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  async function handleUpload(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
  }

  async function uploadPdf() {
    if (!file) return alert('Select a PDF first');
    setUploading(true);
    const form = new FormData();
    form.append('file', file);

    const uploadUrl = 'http://localhost:5000/upload'; // ✅ fixed

    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessages(m => [...m, { role: 'system', text: `✅ PDF "${file.name}" uploaded and indexed.` }]);
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function askQuestion() {
    if (!question.trim()) return;
    setLoadingAnswer(true);
    setMessages(m => [...m, { role: 'user', text: question }]);

    const askUrl = 'http://localhost:5000/ask'; // ✅ fixed

    try {
      const res = await fetch(askUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, filename: file?.name }), // ✅ include filename
      });
      if (!res.ok) throw new Error(await res.text());
      const { answer } = await res.json();
      setMessages(m => [...m, { role: 'assistant', text: answer }]);
      setQuestion('');
    } catch (err) {
      console.error(err);
      setMessages(m => [...m, { role: 'assistant', text: 'Error: ' + err.message }]);
    } finally {
      setLoadingAnswer(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5CBCB] to-[#FFEAEA] p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-4">Chat with PDF — demo</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Upload PDF</label>
          <div className="mt-2 flex gap-2">
            <input type="file" accept="application/pdf" onChange={handleUpload} />
            <button
              onClick={uploadPdf}
              disabled={!file || uploading}
              className="px-4 py-2 bg-[#748DAE] text-white rounded-lg disabled:opacity-60"
            >
              {uploading ? 'Uploading...' : 'Upload & Index'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            After upload, you can ask questions based on this PDF.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Ask a question</label>
          <div className="mt-2 flex gap-2">
            <input
              className="flex-1 rounded-lg border p-2"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Summarize the key steps in section 2"
            />
            <button
              onClick={askQuestion}
              disabled={loadingAnswer}
              className="px-4 py-2 bg-[#9ECAD6] text-white rounded-lg disabled:opacity-60"
            >
              {loadingAnswer ? 'Thinking...' : 'Ask'}
            </button>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                m.role === 'user'
                  ? 'bg-[#FFEAEA]'
                  : m.role === 'assistant'
                  ? 'bg-[#F5F7FA]'
                  : 'bg-[#E8F9F9]'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{m.text}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Replace the upload & ask URLs with your n8n webhook URLs after importing the supplied workflow.
        </div>
      </div>
    </div>
  );
}

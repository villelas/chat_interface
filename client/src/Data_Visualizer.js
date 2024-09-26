import React, { useState } from 'react';
import * as d3 from 'd3-dsv';

const DataVisualizer = ({ setCsvData }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [showData, setShowData] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // For drag-and-drop feedback

  const handleFileUpload = async (uploadedFile) => {
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      setError('');
      setFile(uploadedFile);
      const reader = new FileReader();

      reader.onload = async (event) => {
        const csvText = event.target.result;
        const parsedData = d3.csvParse(csvText, d3.autoType);

        setCsvData(parsedData); // Only set the parsed data to the parent

        const preview = parsedData.slice(0, 10);
        setPreviewData(preview);
        setShowData(true);

        // Send the CSV file to the backend
        const formData = new FormData();
        formData.append('file', uploadedFile);

        try {
          const response = await fetch('http://localhost:8000/upload-csv', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload CSV.');
          }

          const result = await response.json();
          console.log('Upload result:', result);
        } catch (error) {
          console.error('Upload error:', error);
          setError('Error uploading the CSV file.');
        }
      };
      reader.readAsText(uploadedFile);
    } else {
      setError('Only CSV files are allowed.');
      setFile(null);
      setPreviewData([]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const toggleDataVisibility = () => {
    setShowData(!showData);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-xl font-semibold mb-4 text-primary">Upload a CSV File:</h2>

      <div
        className={`border-2 border-dashed rounded-lg p-4 w-full max-w-2xl text-center mb-2 ${isDragging ? 'border-accent' : 'border-info'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-white">Drag and drop your CSV file here or</p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => handleFileUpload(e.target.files[0])}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="btn btn-outline btn-info mt-2">
          Choose File
        </label>
      </div>

      {/* Error Message */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Display file name after upload */}
      {file && <p className="text-white">Uploaded File: {file.name}</p>}

      {/* Toggle Button for showing/hiding data */}
      {previewData.length > 0 && (
        <button className="btn btn-primary mt-4" onClick={toggleDataVisibility}>
          {showData ? 'Hide CSV Data' : 'Show CSV Data'}
        </button>
      )}

      {/* Show only first 5-10 rows (df.head equivalent) */}
      {showData && previewData.length > 0 && (
        <table className="text-white bg-gray-900 p-4 rounded-md mt-4 w-full text-center">
          <thead>
            <tr>
              {Object.keys(previewData[0]).map((key) => (
                <th key={key} className="p-2">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((value, i) => (
                  <td key={i} className="p-2">{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DataVisualizer;

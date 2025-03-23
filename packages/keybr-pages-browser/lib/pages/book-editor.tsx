import { Book } from "@keybr/content";
import * as React from "react";
import { useState, useCallback, useEffect } from "react";

// Custom styles for the Book Editor
const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "10px",
    fontFamily: "Arial, sans-serif",
    color: "#333",
  },
  header: {
    fontSize: "20px",
    marginBottom: "8px",
    fontWeight: "bold",
  },
  formGroup: {
    marginBottom: "0px",
  },
  bookSelectGroup: {
    marginBottom: "2px",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "2px",
    fontSize: "14px",
  },
  select: {
    width: "400px",
    padding: "6px 8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#fff",
    marginBottom: "5px",
  },
  button: {
    padding: "5px 10px",
    fontSize: "14px",
    backgroundColor: "#4a4a4a",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "8px",
    width: "120px",
    textAlign: "center" as const,
  },
  dangerButton: {
    backgroundColor: "#d9534f",
  },
  successButton: {
    backgroundColor: "#5cb85c",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
    marginBottom: "5px",
  },
  textarea: {
    width: "100%",
    minHeight: "200px",
    padding: "6px 8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.3",
  },
  input: {
    width: "400px",
    padding: "6px 8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginBottom: "5px",
  },
  successMessage: {
    padding: "4px 8px",
    backgroundColor: "#dff0d8",
    border: "1px solid #d6e9c6",
    borderRadius: "4px",
    color: "#3c763d",
    marginBottom: "8px",
    fontSize: "14px",
  },
  modal: {
    position: "fixed" as const,
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "1000",
  },
  modalContent: {
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "4px",
    width: "300px",
    maxWidth: "90%",
  },
  modalHeader: {
    fontSize: "16px",
    marginBottom: "5px",
    fontWeight: "bold",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "8px",
  },
  paragraph: {
    fontSize: "13px",
    margin: "0 0 5px 0",
  }
};

export default function BookEditorPage(): React.ReactNode {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [bookContent, setBookContent] = useState<any | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNewChapterForm, setShowNewChapterForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Reset success messages after 3 seconds
  useEffect(() => {
    if (saveSuccess || deleteSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
        setDeleteSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [saveSuccess, deleteSuccess]);

  const fetchBookContent = useCallback(async (bookId: string) => {
    try {
      console.log("Fetching book content for", bookId);
      const response = await fetch(`/_/books/${bookId}?content=true`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch book: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Book content loaded:", data.content?.length || 0, "chapters");
      setBookContent(data);
      
      // If we had a chapter selected but it no longer exists, reset selection
      if (currentChapterIndex !== null && (!data.content || currentChapterIndex >= data.content.length)) {
        console.log("Selected chapter no longer exists, resetting selection");
        setCurrentChapterIndex(null);
        setEditedText("");
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching book content:", error);
      return null;
    }
  }, [currentChapterIndex]);

  const handleBookSelect = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedBookId(value);
    fetchBookContent(value);
  }, [fetchBookContent]);

  const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = e.target.value === '' ? null : parseInt(e.target.value, 10);
    setCurrentChapterIndex(index);
    
    if (index !== null && bookContent?.content[index]) {
      // Set the chapter title
      setEditedTitle(bookContent.content[index][0]);
      
      const chapterContent = bookContent.content[index][1];
      // Handle empty content cases properly
      if (Array.isArray(chapterContent) && chapterContent.length > 0) {
        setEditedText(chapterContent.join('\n\n'));
      } else {
        // Handle empty chapter with empty string
        setEditedText('');
      }
    } else {
      setEditedTitle('');
      setEditedText('');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedText(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
  };

  // New function to clean text by removing timestamps and filler words
  const cleanText = (text: string): string => {
    // Remove timestamps in various formats from the beginning of lines
    // Matches formats like "0:14", "1:23:45", "[00:14]", "(1:23)", etc.
    let cleaned = text.replace(/^\s*[\[\(\{]?\d+:?\d+(?::\d+)?[\]\)\}]?\s*/gm, '');
    
    // Remove filler words - common speech disfluencies
    cleaned = cleaned.replace(/\b(um|uh|uhh|hmm|err|like|you know|sort of|kind of|basically|actually|literally|so yeah|right|okay)\b/gi, '');
    
    // Special case for timestamps that might appear in the middle of a line
    // This is more aggressive and should be used with caution
    cleaned = cleaned.replace(/\s+[\[\(\{]?\d+:?\d+(?::\d+)?[\]\)\}]?\s+/g, ' ');
    
    // Merge lines that were previously separated by timestamps
    // by replacing single newlines with spaces, preserving paragraph breaks (double newlines)
    cleaned = cleaned.replace(/([^\n])\n([^\n])/g, '$1 $2');
    
    // Clean up any extra spaces that might have been created
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBookId && currentChapterIndex !== null) {
      setSaving(true);
      try {
        // Clean the text first to remove timestamps and filler words
        const cleanedText = cleanText(editedText);
        
        // Split text on double newlines to create paragraphs
        let paragraphs: string[];
        
        if (cleanedText.trim() === '') {
          // If text is empty, create a single empty paragraph
          paragraphs = [''];
        } else {
          paragraphs = cleanedText
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter((p) => p !== '');
          
          // Ensure at least one paragraph exists
          if (paragraphs.length === 0) {
            paragraphs = [''];
          }
        }
        
        const response = await fetch(`/_/books/${selectedBookId}/chapter/${currentChapterIndex}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            content: paragraphs,
            title: editedTitle.trim()
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save chapter');
        }
        
        // Update the local state to reflect the saved content
        if (bookContent) {
          const updatedContent = [...bookContent.content];
          updatedContent[currentChapterIndex][0] = editedTitle.trim();
          updatedContent[currentChapterIndex][1] = paragraphs;
          setBookContent({
            ...bookContent,
            content: updatedContent,
          });
        }
        
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error) {
        console.error('Error saving chapter:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleAddChapter = useCallback(() => {
    setShowNewChapterForm(true);
    setNewChapterTitle("");
  }, []);

  const handleCreateChapter = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (selectedBookId === null || !newChapterTitle.trim()) {
      return;
    }

    setSaving(true);
    try {
      // Determine position based on selection:
      // - If no chapter is selected, add at position 0 (top)
      // - If a chapter is selected, add after that chapter
      const position = currentChapterIndex !== null 
        ? currentChapterIndex + 1 
        : 0;
      
      console.log(`Creating new chapter "${newChapterTitle}" at position ${position}`);
      
      // Send request to create a new chapter
      const response = await fetch(`/_/books/${selectedBookId}/chapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: newChapterTitle,
          position: position
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create chapter: ${response.statusText}`);
      }

      // Refresh the book content to get the new chapter
      const updatedBook = await fetchBookContent(selectedBookId);
      
      // Select the newly created chapter if the refresh was successful
      if (updatedBook && updatedBook.content) {
        setCurrentChapterIndex(position);
        
        // Initialize with empty text for the new chapter
        if (updatedBook.content[position] && Array.isArray(updatedBook.content[position][1])) {
          setEditedText(updatedBook.content[position][1].join('\n\n'));
        } else {
          setEditedText('');
        }
      }
      
      setShowNewChapterForm(false);
      setSaveSuccess(true);
    } catch (error) {
      console.error("Error creating chapter:", error);
    } finally {
      setSaving(false);
    }
  }, [selectedBookId, newChapterTitle, currentChapterIndex, fetchBookContent]);

  const handleCancelAddChapter = useCallback(() => {
    setShowNewChapterForm(false);
  }, []);

  const handleDeleteChapter = async () => {
    if (selectedBookId === null || currentChapterIndex === null) {
      console.log("Nothing selected to delete");
      return false;
    }

    setSaving(true);
    try {
      console.log(`Attempting to delete chapter ${currentChapterIndex} from book ${selectedBookId}`);
      
      // Send DELETE request to the server
      const response = await fetch(`/_/books/${selectedBookId}/chapter/${currentChapterIndex}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delete chapter failed:", response.status, errorText);
        
        // If the error is about index out of range, we need to refresh our data
        if (errorText.includes("index out of range") || errorText.includes("no chapters")) {
          console.log("Content mismatch detected, refreshing from server");
          await fetchBookContent(selectedBookId);
        }
        
        throw new Error(`Failed to delete chapter: ${response.statusText}`);
      }

      console.log("Chapter deleted successfully, refreshing content");
      // Always refresh content after a successful deletion
      await fetchBookContent(selectedBookId);
      
      // Reset UI state
      setCurrentChapterIndex(null);
      setEditedText("");
      setShowConfirmDelete(false);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
      
      return true;
    } catch (error) {
      console.error("Error deleting chapter:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDelete = useCallback(() => {
    setShowConfirmDelete(false);
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Book Editor</h1>
      
      {/* Success Messages */}
      {saveSuccess && (
        <div style={styles.successMessage}>
          Chapter saved successfully!
        </div>
      )}
      
      {deleteSuccess && (
        <div style={styles.successMessage}>
          Chapter deleted successfully!
        </div>
      )}
      
      {/* Book Selection and Add Chapter Button */}
      <div style={styles.bookSelectGroup}>
        <label style={styles.label} htmlFor="book-select">Select a book:</label>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select 
            id="book-select"
            style={{...styles.select, marginBottom: "2px"}}
            value={selectedBookId || ''}
            onChange={handleBookSelect}
          >
            <option value="" disabled>Choose a book</option>
            {Array.from(Book.ALL).map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
          {selectedBookId && (
            <button 
              type="button" 
              style={styles.button}
              onClick={handleAddChapter}
            >
              Add Chapter
            </button>
          )}
        </div>
      </div>
      
      {/* Chapter Selection and Delete Button */}
      {selectedBookId && bookContent && (
        <div style={styles.formGroup}>
          <label style={{...styles.label, marginTop: "0"}} htmlFor="chapter-select">Chapter:</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select 
              id="chapter-select"
              style={styles.select}
              value={currentChapterIndex !== null ? currentChapterIndex : ''}
              onChange={handleChapterSelect}
              disabled={!bookContent?.content?.length}
            >
              <option value="" disabled>Select a chapter</option>
              {bookContent?.content?.map((chapter: [string, string[]], index: number) => (
                <option key={index} value={index}>
                  {chapter[0]}
                </option>
              ))}
            </select>
            {currentChapterIndex !== null && (
              <button 
                type="button" 
                style={{...styles.button, ...styles.dangerButton}}
                onClick={() => setShowConfirmDelete(true)}
              >
                Delete Chapter
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalHeader}>Delete Chapter?</h2>
            <p style={styles.paragraph}>Are you sure you want to delete this chapter?</p>
            <div style={styles.modalActions}>
              <button 
                type="button" 
                style={styles.button}
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button 
                type="button" 
                style={{...styles.button, ...styles.dangerButton}}
                onClick={handleDeleteChapter}
                disabled={saving}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* New Chapter Form */}
      {showNewChapterForm && (
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="chapter-title">New Chapter Title:</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
            <input
              id="chapter-title"
              type="text"
              style={{...styles.input, width: "400px", flexGrow: 0, marginBottom: 0}}
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Enter chapter title"
            />
            <button 
              type="button" 
              style={{...styles.button, ...styles.successButton}}
              onClick={handleCreateChapter}
              disabled={saving || !newChapterTitle.trim()}
            >
              Create
            </button>
            <button 
              type="button" 
              style={styles.button}
              onClick={handleCancelAddChapter}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Chapter Editor */}
      {selectedBookId && currentChapterIndex !== null && (
        <form onSubmit={handleSubmit}>
          <div style={{...styles.formGroup, marginBottom: 0}}>
            {/* Chapter Title Edit */}
            <label style={{...styles.label, marginBottom: "2px"}} htmlFor="chapter-title-edit">Chapter Title:</label>
            <input
              id="chapter-title-edit"
              type="text"
              style={{...styles.input, marginBottom: "10px"}}
              value={editedTitle}
              onChange={handleTitleChange}
              placeholder="Enter chapter title"
              disabled={saving}
            />
            
            {/* Chapter Content Edit */}
            <label style={{...styles.label, marginBottom: 0}} htmlFor="chapter-content">Chapter Content:</label>
            <p style={{...styles.paragraph, marginBottom: "2px"}}>Separate paragraphs with blank lines (press Enter twice).</p>
            <textarea
              id="chapter-content"
              style={{...styles.textarea, marginBottom: "5px"}}
              value={editedText}
              onChange={handleTextChange}
              disabled={saving}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button 
                type="button" 
                style={styles.button}
                onClick={() => setEditedText(cleanText(editedText))}
                disabled={saving || !editedText.trim()}
                title="Removes timestamps, filler words (uh, um), and merges lines into paragraphs"
              >
                Clean Text
              </button>
              <button 
                type="submit" 
                style={{...styles.button, ...styles.successButton}}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
} 
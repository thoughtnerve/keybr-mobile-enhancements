import { Book } from "@keybr/content";
import * as React from "react";
import { useState, useCallback, useEffect } from "react";

// Define the BookContent type inline instead of importing it
type BookContent = Array<[string, string[]]>;
type Chapter = [string, string[]];

// Custom styles for the Book Editor
const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "10px",
    fontFamily: "Arial, sans-serif",
    color: "var(--text-color)",
  },
  header: {
    fontSize: "20px",
    marginBottom: "8px",
    fontWeight: "bold",
    color: "var(--text-color)",
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
    color: "var(--text-color)",
  },
  select: {
    width: "400px",
    padding: "6px 8px",
    fontSize: "14px",
    border: "1px solid var(--accent-d1)",
    borderRadius: "4px",
    backgroundColor: "var(--primary-l1)",
    marginBottom: "5px",
    color: "var(--text-color)",
  },
  button: {
    padding: "5px 10px",
    fontSize: "14px",
    backgroundColor: "var(--accent)",
    color: "var(--primary-l2)",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "8px",
    width: "120px",
    textAlign: "center" as const,
  },
  dangerButton: {
    backgroundColor: "var(--error)",
  },
  successButton: {
    backgroundColor: "var(--Value--more__color)",
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
    border: "1px solid var(--accent-d1)",
    borderRadius: "4px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.3",
    backgroundColor: "var(--primary-l1)",
    color: "var(--text-color)",
  },
  input: {
    width: "400px",
    padding: "6px 8px",
    fontSize: "14px",
    border: "1px solid var(--accent-d1)",
    borderRadius: "4px",
    marginBottom: "5px",
    backgroundColor: "var(--primary-l1)",
    color: "var(--text-color)",
  },
  successMessage: {
    padding: "4px 8px",
    backgroundColor: "var(--Value--more__color)",
    border: "1px solid var(--accent-d1)",
    borderRadius: "4px",
    color: "var(--primary-l2)",
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
    backgroundColor: "var(--primary)",
    padding: "10px",
    borderRadius: "4px",
    width: "300px",
    maxWidth: "90%",
  },
  modalHeader: {
    fontSize: "16px",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "var(--text-color)",
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
    color: "var(--text-color)",
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [shouldCleanText, setShouldCleanText] = useState(true);

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
      
      // Validate the content structure
      if (!data.content || !Array.isArray(data.content)) {
        console.error("Invalid book content structure - content is not an array:", data);
        return null;
      }

      // Log first chapter as a sample to verify structure
      if (data.content.length > 0) {
        const firstChapter = data.content[0];
        console.log("First chapter structure:", {
          title: firstChapter[0],
          paragraphCount: Array.isArray(firstChapter[1]) ? firstChapter[1].length : 'not an array'
        });
      }
      
      setBookContent(data);
      
      // If we had a chapter selected but it no longer exists, reset selection
      if (currentChapterIndex !== null && (!data.content || currentChapterIndex >= data.content.length)) {
        console.log("Selected chapter no longer exists, resetting selection");
        setCurrentChapterIndex(null);
        setEditedText("");
        setEditedTitle("");
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching book content:", error);
      return null;
    }
  }, [currentChapterIndex]);

  const handleBookSelect = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    console.log(`Book selected: ${value}`);
    setSelectedBookId(value);
    // Reset chapter selection when changing books
    setCurrentChapterIndex(null);
    setEditedText("");
    setEditedTitle("");
    fetchBookContent(value);
  }, [fetchBookContent]);

  const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = e.target.value === '' ? null : parseInt(e.target.value, 10);
    console.log(`Chapter selected from dropdown: ${index}`);
    
    if (index !== null && bookContent?.content?.[index]) {
      setCurrentChapterIndex(index);
      
      // Set the chapter title
      const title = bookContent.content[index][0] || '';
      setEditedTitle(title);
      console.log(`Setting chapter title: "${title}"`);
      
      const chapterContent = bookContent.content[index][1];
      // Handle empty content cases properly
      if (Array.isArray(chapterContent) && chapterContent.length > 0) {
        const text = chapterContent.join('\n\n');
        setEditedText(text);
        console.log(`Setting chapter content: ${chapterContent.length} paragraphs`);
      } else {
        // Handle empty chapter with empty string
        setEditedText('');
        console.log(`Chapter has no content, setting empty text`);
      }
    } else {
      setCurrentChapterIndex(null);
      setEditedTitle('');
      setEditedText('');
      console.log(`No chapter selected or invalid index, clearing editor`);
    }
  };

  // New function to clean text by removing timestamps and filler words
  const cleanText = (text: string) => {
    if (!text) return "";
    
    // Improved timestamp removal - handles various formats:
    // [00:05:23], [5:23], (01:42), 00:15, [01:42.500], etc.
    let cleanedText = text.replace(/[\[\(]?\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?[\]\)]?/g, "");
    
    // Remove filler words
    const fillerWords = ["um", "uh", "like", "you know", "basically", "actually", "literally"];
    fillerWords.forEach(word => {
      cleanedText = cleanedText.replace(new RegExp(`\\b${word}\\b`, "gi"), "");
    });
    
    // Fix line breaks - convert multiple empty lines to single line breaks
    cleanedText = cleanedText.replace(/\n{3,}/g, "\n\n");
    
    // Merge text that was broken across lines but should be a single paragraph
    // If a line doesn't end with a period, question mark, exclamation point, or colon,
    // and the next line doesn't start with a bullet or number, join them
    cleanedText = cleanedText.replace(/([^.!?:])\n(?![•\-\d\n])/g, "$1 ");
    
    // Replace multiple spaces with a single space
    cleanedText = cleanedText.replace(/ {2,}/g, " ");
    
    return cleanedText.trim();
  };

  // Keep the original unedited text separate from the display text
  const [originalText, setOriginalText] = useState("");

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Just set the text directly - we'll clean it only when saving
    setEditedText(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBookId && currentChapterIndex !== null) {
      setSaving(true);
      try {
        // Apply text cleaning before saving, but only if the cleanup option is enabled
        const textToProcess = shouldCleanText ? cleanText(editedText) : editedText;
        console.log(`${shouldCleanText ? "Cleaned" : "Processing"} text for saving`);
        
        // Split text on double newlines to create paragraphs
        let paragraphs: string[];
        
        if (textToProcess.trim() === '') {
          // If text is empty, create a single empty paragraph
          paragraphs = [''];
        } else {
          paragraphs = textToProcess
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter((p) => p !== '');
          
          // Ensure at least one paragraph exists
          if (paragraphs.length === 0) {
            paragraphs = [''];
          }
        }
        
        console.log(`Saving chapter ${currentChapterIndex} with title "${editedTitle}" and ${paragraphs.length} paragraphs`);
        
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
          console.log(`Updated local state with saved content`);
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
    // Clear out any existing chapter selection and content when adding a new chapter
    setCurrentChapterIndex(null);
    setEditedText("");
    setEditedTitle("");
    
    // Show the new chapter form
    setShowNewChapterForm(true);
    setNewChapterTitle("");
    console.log("Cleared editor for new chapter creation");
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
        console.log(`New chapter created at index ${position}`);
        
        // Initialize with empty text for the new chapter
        if (updatedBook.content[position] && Array.isArray(updatedBook.content[position][1])) {
          const chapterText = updatedBook.content[position][1].join('\n\n');
          setEditedText(chapterText);
          setEditedTitle(updatedBook.content[position][0] || '');
          console.log(`Initialized editor with new chapter content`);
        } else {
          setEditedText('');
          setEditedTitle(newChapterTitle);
          console.log(`Initialized editor with empty content for new chapter`);
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

  const handleDeleteChapter = async (index: number) => {
    if (!bookContent || isDeleting) return;

    try {
      setIsDeleting(true);
      console.log(`Attempting to delete chapter at index ${index}`);
      const response = await fetch(`/_/books/${selectedBookId}/chapter/${index}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to delete chapter:", errorData);
        
        // Check if it's an "index out of range" error
        if (errorData.error && errorData.error.includes("index out of range")) {
          console.log("Index out of range error detected, refreshing book content");
          // Refresh the book content from the server
          const refreshResponse = await fetch(`/_/books/${selectedBookId}`);
          if (refreshResponse.ok) {
            const refreshedBook = await refreshResponse.json();
            setBookContent(refreshedBook);
            console.log("Book content refreshed from server");
            
            // Reset selection if the current selection is invalid
            if (currentChapterIndex === index || currentChapterIndex === null) {
              setCurrentChapterIndex(null);
              setEditedText("");
              setEditedTitle("");
              console.log(`Reset selection after index out of range error`);
            }
          }
        }
        return;
      }

      const result = await response.json();
      console.log("Delete chapter result:", result);

      // Wait briefly before refreshing to ensure the server has completed the operation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh the book content after deletion
      const refreshResponse = await fetch(`/_/books/${selectedBookId}`);
      const refreshedBook = await refreshResponse.json();
      setBookContent(refreshedBook);
      console.log(`Refreshed book content after deletion, now has ${refreshedBook.content?.length || 0} chapters`);

      // Reset selection if the deleted chapter was selected
      if (currentChapterIndex === index) {
        setCurrentChapterIndex(null);
        setEditedText("");
        setEditedTitle("");
        console.log(`Deleted the currently selected chapter, clearing selection`);
      }
      // If the selected chapter is after the deleted one, decrement the index
      else if (currentChapterIndex !== null && currentChapterIndex > index) {
        const newIndex = currentChapterIndex - 1;
        setCurrentChapterIndex(newIndex);
        console.log(`Adjusted selection index to ${newIndex} after deletion`);
        
        // Update the text and title to match the new selection
        if (refreshedBook.content && refreshedBook.content[newIndex]) {
          const chapter = refreshedBook.content[newIndex];
          setEditedTitle(chapter[0]);
          setEditedText(chapter[1].join('\n\n'));
          console.log(`Updated editor content for adjusted chapter selection`);
        }
      }

      // Show delete success message
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
      
      // Close the confirmation dialog
      setShowConfirmDelete(false);

    } catch (error) {
      console.error("Error deleting chapter:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = useCallback(() => {
    setShowConfirmDelete(false);
  }, []);

  useEffect(() => {
    // Load the selected book data when component mounts or book changes
    if (selectedBookId) {
      console.log(`Loading book content for ${selectedBookId}`);
      fetchBookContent(selectedBookId);
    }
  }, [selectedBookId, fetchBookContent]);

  // Return the JSX for the component
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
                onClick={() => handleDeleteChapter(currentChapterIndex || 0)}
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
            <div style={{display: "flex", alignItems: "center", marginBottom: "10px"}}>
              <input 
                id="clean-text-checkbox"
                type="checkbox"
                checked={shouldCleanText}
                onChange={(e) => setShouldCleanText(e.target.checked)}
                style={{marginRight: "5px"}}
              />
              <label 
                htmlFor="clean-text-checkbox" 
                style={{
                  fontSize: "13px", 
                  cursor: "pointer",
                  color: "var(--text-color)",
                  fontWeight: "500"
                }}
                title="Removes timestamps, filler words, and fixes paragraph formatting"
              >
                Clean up text when saving (removes timestamps, filler words, fixes formatting)
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div></div> {/* Empty div to maintain layout with flexbox */}
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
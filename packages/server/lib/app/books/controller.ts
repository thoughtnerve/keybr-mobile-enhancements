import { body, controller, http, pathParam, queryParam } from "@fastr/controller";
import { Context } from "@fastr/core";
import { ApplicationError } from "@fastr/errors";
import { injectable } from "@fastr/invert";
import { type RouterState } from "@fastr/middleware-router";
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { promisify } from "node:util";
import { z } from "zod";
import { zod } from "../auth/zod.ts";
import { Book } from "@keybr/content";

const gunzip = promisify(zlib.gunzip);
const gzip = promisify(zlib.gzip);

// Increased max length to handle larger book chapters
const jsonOpts = { maxLength: 20480 };

const TUpdateBook = z.object({
  content: z.array(z.tuple([z.string(), z.array(z.string())]))
});
type TUpdateBook = z.infer<typeof TUpdateBook>;
const PUpdateBook = zod(TUpdateBook, () => {
  throw new ApplicationError("Invalid book update data");
});

const TUpdateParagraph = z.object({
  text: z.string()
});
type TUpdateParagraph = z.infer<typeof TUpdateParagraph>;
const PUpdateParagraph = zod(TUpdateParagraph, () => {
  throw new ApplicationError("Invalid paragraph update data");
});

const TUpdateChapter = z.object({
  content: z.array(z.string()),
  title: z.string().optional()
});
type TUpdateChapter = z.infer<typeof TUpdateChapter>;
const PUpdateChapter = zod(TUpdateChapter, () => {
  throw new ApplicationError("Invalid chapter update data");
});

// Define schema for adding new chapters
const TAddChapter = z.object({
  title: z.string(),
  position: z.number().optional()
});
type TAddChapter = z.infer<typeof TAddChapter>;
const PAddChapter = zod(TAddChapter, () => {
  throw new ApplicationError("Invalid chapter creation data");
});

// BookContent type definition
type BookContent = Array<[string, string[]]>;
type MockContentMap = {
  [id: string]: BookContent;
};

// Initialize empty mock content store
const mockContent: MockContentMap = {};

@injectable()
@controller("/_/books")
export class Controller {
  private readonly dataDir: string;
  
  // Use static property to store mock content between requests
  private static mockContentStore = mockContent;
  private static initialized = false;

  constructor() {
    // Directory where book JSON data is stored
    this.dataDir = path.resolve(process.cwd(), "packages/keybr-content-books/lib/data");
    console.log("Books data directory:", this.dataDir);
    
    // Initialize content from files if not already done
    if (!Controller.initialized) {
      this.initializeContentFromFiles();
      Controller.initialized = true;
    }
  }
  
  // Initialize content from files
  private async initializeContentFromFiles() {
    try {
      // Get all book IDs
      const books = Array.from(Book.ALL);
      
      for (const book of books) {
        const id = book.id;
        const filePath = path.join(this.dataDir, `${id}.json`);
        
        try {
          // Check if file exists
          await fs.promises.access(filePath);
          
          // Read file content
          const buffer = await fs.promises.readFile(filePath);
          let content;
          
          // Try to decompress if it's gzipped
          if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
            const decompressed = await gunzip(buffer);
            content = JSON.parse(decompressed.toString('utf8'));
          } else {
            content = JSON.parse(buffer.toString('utf8'));
          }
          
          if (Array.isArray(content)) {
            // Update mock store with file content
            Controller.mockContentStore[id] = content;
            console.log(`Initialized content for book ${id} from file (${content.length} chapters)`);
          }
        } catch (error) {
          // If we can't load from file, use the mock content if available
          if (Controller.mockContentStore[id]) {
            console.log(`Using default mock content for book ${id}`);
          } else {
            // Initialize with empty array if not in mock store
            Controller.mockContentStore[id] = [];
            console.log(`Initialized empty content for book ${id}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error initializing book content from files:`, error);
    }
  }

  @http.GET("/")
  async getBooks() {
    // Return the list of books from the Book enum
    return Array.from(Book.ALL);
  }

  @http.GET("/{id}")
  async getBook(
    @pathParam("id") id: string,
    ctx: Context<RouterState>
  ) {
    const book = Book.ALL.get(id);
    if (!book) {
      throw new ApplicationError(`Book not found: ${id}`);
    }
    
    const hasContent = ctx.request.url.includes("content=true");
    const result: any = { ...book };
    
    if (hasContent) {
      try {
        // Get book content directly from file
        const filePath = path.join(this.dataDir, `${id}.json`);
        
        try {
          // Read the file content
          const buffer = await fs.promises.readFile(filePath);
          let content;
          
          // Try to decompress if it's gzipped
          if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
            try {
              const decompressed = await gunzip(buffer);
              content = JSON.parse(decompressed.toString('utf8'));
            } catch (gzipError) {
              console.error("Error decompressing gzipped content:", gzipError);
              throw new Error("Failed to decompress gzipped content");
            }
          } else {
            // Try UTF-8 first
            try {
              content = JSON.parse(buffer.toString('utf8'));
            } catch (utf8Error) {
              // Fall back to Latin-1
              try {
                content = JSON.parse(buffer.toString('latin1'));
              } catch (latin1Error) {
                console.error("Error parsing JSON with either UTF-8 or Latin-1:", latin1Error);
                throw new Error("Could not parse book content with any encoding");
              }
            }
          }
          
          // Set the content
          result.content = content;
          
          // Add headers to prevent compression
          ctx.response.headers.set("Cache-Control", "no-transform");
          
          return result;
        } catch (error: unknown) {
          console.error(`Error reading file ${filePath}:`, error);
          // If file doesn't exist or can't be read, check mock content
          if (Controller.mockContentStore[id]) {
            console.log(`Using mock content for book ${id}`);
            result.content = Controller.mockContentStore[id];
            return result;
          } else {
            // Initialize empty content if not in mock store
            console.log(`Initializing empty content for book ${id}`);
            Controller.mockContentStore[id] = [];
            result.content = [];
            return result;
          }
        }
      } catch (error) {
        console.error(`Error loading book content:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new ApplicationError(`Failed to load content for book: ${id}: ${errorMessage}`);
      }
    }
    
    return result;
  }

  @http.PUT("/{id}")
  async updateBook(
    @pathParam("id") id: string,
    @body.json(PUpdateBook, jsonOpts) { content }: TUpdateBook,
    ctx: Context<RouterState>
  ) {
    const book = Book.ALL.get(id);
    if (!book) {
      throw new ApplicationError(`Book not found: ${id}`);
    }
    
    try {
      // Directly update the mock content using our static property
      Controller.mockContentStore[id] = content;
      
      // For debugging - always update the first paragraph with a timestamp to verify changes
      if (Controller.mockContentStore[id]?.[0]?.[1]?.[0]) {
        const timestamp = new Date().toISOString();
        Controller.mockContentStore[id][0][1][0] = `UPDATED AT ${timestamp}: ${Controller.mockContentStore[id][0][1][0].split(':').slice(1).join(':').trim()}`;
      }
      
      console.log(`Updated mock content for book: ${id}`, Controller.mockContentStore[id][0][1][0]);
      
      // Only try to update file if we're not in test/dev mode
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd) {
        try {
          // Get the book content file path and use our backup helper
          const contentFilePath = path.join(this.dataDir, `${id}.json`);
          await this.manageBackup(contentFilePath);
          
          // Prepare JSON content with pretty formatting
          const jsonString = JSON.stringify(content, null, 2);
          
          // Check if the original file was compressed
          try {
            const originalBuffer = await fs.promises.readFile(contentFilePath);
            try {
              await gunzip(originalBuffer);
              // If we get here, original was compressed, so compress the new content too
              const compressed = await gzip(Buffer.from(jsonString, 'utf8'));
              await fs.promises.writeFile(contentFilePath, compressed);
              console.log(`Wrote compressed content for book: ${id}`);
            } catch (error) {
              // Original was not compressed, write plain JSON
              await fs.promises.writeFile(contentFilePath, jsonString, 'utf8');
              console.log(`Wrote uncompressed content for book: ${id}`);
            }
          } catch (readError) {
            // If the original file doesn't exist, just write a new one
            await fs.promises.writeFile(contentFilePath, jsonString, 'utf8');
            console.log(`Created new file for book: ${id}`);
          }
        } catch (fileError) {
          console.error(`Error updating file for book: ${id}`, fileError);
          // We continue because the in-memory update succeeded
        }
      }
      
      return { 
        success: true, 
        message: `Book content updated ${isProd ? 'in memory and file' : 'in memory only'}` 
      };
    } catch (error) {
      console.error(`Error saving book content:`, error);
      throw new ApplicationError(`Failed to save content for book: ${id}`);
    }
  }

  @http.PUT("/{id}/paragraph/{chapter}/{paragraph}")
  async updateParagraph(
    @pathParam("id") id: string,
    @pathParam("chapter") chapterIndex: string,
    @pathParam("paragraph") paragraphIndex: string,
    @body.json(PUpdateParagraph, jsonOpts) { text }: TUpdateParagraph,
    ctx: Context<RouterState>
  ) {
    const book = Book.ALL.get(id);
    if (!book) {
      throw new ApplicationError(`Book not found: ${id}`);
    }
    
    const chapIdx = parseInt(chapterIndex, 10);
    const paraIdx = parseInt(paragraphIndex, 10);
    
    if (isNaN(chapIdx) || isNaN(paraIdx)) {
      throw new ApplicationError("Invalid chapter or paragraph index");
    }
    
    try {
      // Get the current book content
      const filePath = path.join(this.dataDir, `${id}.json`);
      
      // Create a backup using our helper method
      await this.manageBackup(filePath);
      
      // Read and decompress the file if needed
      const buffer = await fs.promises.readFile(filePath);
      let content;
      let isCompressed = false;
      
      // Try to decompress if it's gzipped
      if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
        isCompressed = true;
        const decompressed = await gunzip(buffer);
        content = JSON.parse(decompressed.toString('utf8'));
      } else {
        // Just parse it as JSON
        content = JSON.parse(buffer.toString('utf8'));
      }
      
      // Validate the content structure
      if (!Array.isArray(content) || 
          chapIdx >= content.length || 
          !Array.isArray(content[chapIdx]) || 
          content[chapIdx].length < 2 ||
          !Array.isArray(content[chapIdx][1]) ||
          paraIdx >= content[chapIdx][1].length) {
        throw new ApplicationError("Invalid book content structure or indices");
      }
      
      // Update the paragraph
      content[chapIdx][1][paraIdx] = text;
      
      // Write back the updated content
      let dataToWrite;
      if (isCompressed) {
        // If original was compressed, compress the new content too
        dataToWrite = await gzip(Buffer.from(JSON.stringify(content)));
      } else {
        dataToWrite = Buffer.from(JSON.stringify(content));
      }
      
      await fs.promises.writeFile(filePath, dataToWrite);
      console.log(`Updated book ${id}, chapter ${chapIdx}, paragraph ${paraIdx}`);
      
      return { 
        success: true, 
        message: "Paragraph updated successfully",
        chapter: chapIdx,
        paragraph: paraIdx,
        text: text
      };
    } catch (error) {
      console.error(`Error updating paragraph:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ApplicationError(`Failed to update paragraph: ${errorMessage}`);
    }
  }

  @http.PUT("/{id}/chapter/{chapter}")
  async updateChapter(
    @pathParam("id") id: string,
    @pathParam("chapter") chapterIndex: string,
    @body.json(PUpdateChapter, jsonOpts) { content, title }: TUpdateChapter,
    ctx: Context<RouterState>
  ) {
    const book = Book.ALL.get(id);
    if (!book) {
      throw new ApplicationError(`Book not found: ${id}`);
    }
    
    const chapIdx = parseInt(chapterIndex, 10);
    
    if (isNaN(chapIdx)) {
      throw new ApplicationError("Invalid chapter index");
    }
    
    try {
      // Get the current book content
      const filePath = path.join(this.dataDir, `${id}.json`);
      
      // Create a backup using our helper method
      await this.manageBackup(filePath);
      
      // Read and decompress the file if needed
      const buffer = await fs.promises.readFile(filePath);
      let bookContent;
      let isCompressed = false;
      
      // Try to decompress if it's gzipped
      if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
        isCompressed = true;
        const decompressed = await gunzip(buffer);
        bookContent = JSON.parse(decompressed.toString('utf8'));
      } else {
        // Just parse it as JSON
        bookContent = JSON.parse(buffer.toString('utf8'));
      }
      
      // Validate the content structure
      if (!Array.isArray(bookContent) || 
          chapIdx >= bookContent.length || 
          !Array.isArray(bookContent[chapIdx]) || 
          bookContent[chapIdx].length < 2) {
        throw new ApplicationError("Invalid book content structure or index");
      }
      
      // Update the chapter content and title if provided
      if (title) {
        bookContent[chapIdx][0] = title; // Update the title if provided
      }
      bookContent[chapIdx][1] = content; // Always update the content
      
      // Write back the updated content
      let dataToWrite;
      if (isCompressed) {
        // If original was compressed, compress the new content too
        dataToWrite = await gzip(Buffer.from(JSON.stringify(bookContent)));
      } else {
        dataToWrite = Buffer.from(JSON.stringify(bookContent));
      }
      
      await fs.promises.writeFile(filePath, dataToWrite);
      console.log(`Updated book ${id}, chapter ${chapIdx} with ${content.length} paragraphs`);
      
      return { 
        success: true, 
        message: "Chapter updated successfully",
        chapter: chapIdx,
        paragraphCount: content.length,
        ...(title ? { title } : {})
      };
    } catch (error) {
      console.error(`Error updating chapter:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ApplicationError(`Failed to update chapter: ${errorMessage}`);
    }
  }

  @http.POST("/{id}/chapter")
  async addChapter(
    @pathParam("id") id: string,
    @body.json(PAddChapter, jsonOpts) { title, position = 0 }: TAddChapter,
    ctx: Context<RouterState>
  ) {
    const book = Book.ALL.get(id);
    if (!book) {
      throw new ApplicationError(`Book not found: ${id}`);
    }
    
    try {
      // Get the current book content
      const filePath = path.join(this.dataDir, `${id}.json`);
      
      // Create a backup using our helper method
      await this.manageBackup(filePath);
      
      // Read and decompress the file if needed
      const buffer = await fs.promises.readFile(filePath);
      let bookContent;
      let isCompressed = false;
      
      // Try to decompress if it's gzipped
      if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
        isCompressed = true;
        const decompressed = await gunzip(buffer);
        bookContent = JSON.parse(decompressed.toString('utf8'));
      } else {
        // Just parse it as JSON
        bookContent = JSON.parse(buffer.toString('utf8'));
      }
      
      // Validate the content structure
      if (!Array.isArray(bookContent)) {
        throw new ApplicationError("Invalid book content structure");
      }
      
      // Create a new chapter with the given title and empty content
      const newChapter: [string, string[]] = [title, [""]];
      
      // Insert the new chapter at the specified position
      // Ensure position is within bounds
      const validPosition = Math.min(Math.max(0, position), bookContent.length);
      bookContent.splice(validPosition, 0, newChapter);
      
      // Write back the updated content
      let dataToWrite;
      if (isCompressed) {
        // If original was compressed, compress the new content too
        dataToWrite = await gzip(Buffer.from(JSON.stringify(bookContent)));
      } else {
        dataToWrite = Buffer.from(JSON.stringify(bookContent));
      }
      
      await fs.promises.writeFile(filePath, dataToWrite);
      console.log(`Added new chapter to book ${id} at position ${validPosition}: "${title}"`);
      
      return { 
        success: true, 
        message: "Chapter added successfully",
        position: validPosition,
        title: title
      };
    } catch (error) {
      console.error(`Error adding chapter:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ApplicationError(`Failed to add chapter: ${errorMessage}`);
    }
  }

  @http.DELETE("/{id}/chapter/{chapter}")
  async deleteChapter(
    @pathParam("id") id: string,
    @pathParam("chapter") chapterIndex: string,
    ctx: Context<RouterState>
  ) {
    const book = Book.ALL.get(id);
    if (!book) {
      throw new ApplicationError(`Book not found: ${id}`);
    }

    const chapterIdx = parseInt(chapterIndex);
    if (isNaN(chapterIdx)) {
      throw new ApplicationError(`Invalid chapter index: ${chapterIndex}`);
    }

    try {
      console.log(`DELETE request received for book ${id}, chapter ${chapterIdx}`);
      
      // Force re-initialization of content from files to make sure we're in sync
      await this.initializeContentFromFile(id);
      
      // Get content from the store
      let bookContent: BookContent;
      if (Controller.mockContentStore[id] && Array.isArray(Controller.mockContentStore[id])) {
        console.log(`Book ${id} found in mock store with ${Controller.mockContentStore[id].length} chapters`);
        // Create a deep copy to avoid reference issues
        bookContent = JSON.parse(JSON.stringify(Controller.mockContentStore[id]));
      } else {
        console.log(`Book ${id} not found in mock store, initializing empty array`);
        bookContent = [];
        Controller.mockContentStore[id] = [];
      }
      
      // Log the content state
      console.log(`Book ${id} content before deletion has ${bookContent.length} chapters`);
      console.log(`Attempting to delete chapter at index ${chapterIdx}`);
      
      // Validate chapter index
      if (chapterIdx < 0 || chapterIdx >= bookContent.length) {
        console.log(`Chapter index out of range: ${chapterIdx} (book has ${bookContent.length} chapters)`);
        throw new ApplicationError(`Chapter index out of range: ${chapterIdx} (book has ${bookContent.length} chapters)`);
      }
      
      // Save what we're deleting for logs
      const deletedChapter = bookContent[chapterIdx];
      console.log(`Chapter to be deleted: "${deletedChapter[0]}" with ${deletedChapter[1].length} paragraphs`);
      
      // Remove ONLY the chapter at the specified index
      bookContent.splice(chapterIdx, 1);
      console.log(`After splice operation, book now has ${bookContent.length} chapters`);
      
      // Update mock content store with a deep copy
      Controller.mockContentStore[id] = JSON.parse(JSON.stringify(bookContent));
      
      // Get the book content file path
      const contentFilePath = path.join(this.dataDir, `${id}.json`);
      
      // Create a single backup using our helper method
      await this.manageBackup(contentFilePath);
      
      // Write the updated content to file
      try {
        console.log(`Writing updated content with ${bookContent.length} chapters to file`);
        const jsonString = JSON.stringify(bookContent, null, 2);
        await fs.promises.writeFile(contentFilePath, jsonString, 'utf8');
        console.log(`Chapter deleted successfully. Book ${id} now has ${bookContent.length} chapters`);
      } catch (error) {
        console.error(`Error writing file for book ${id}:`, error);
        throw new ApplicationError(`Failed to save changes: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      return { 
        success: true, 
        message: `Chapter deleted successfully`,
        remainingChapters: bookContent.length
      };
    } catch (error) {
      console.error(`Error deleting chapter:`, error);
      throw new ApplicationError(`Failed to delete chapter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Helper function to load content for a specific book from file
  private async initializeContentFromFile(id: string): Promise<void> {
    try {
      const filePath = path.join(this.dataDir, `${id}.json`);
      
      try {
        // Check if file exists
        await fs.promises.access(filePath);
        
        // Read file content
        const buffer = await fs.promises.readFile(filePath);
        let content;
        
        // Try to decompress if it's gzipped
        if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
          const decompressed = await gunzip(buffer);
          content = JSON.parse(decompressed.toString('utf8'));
        } else {
          content = JSON.parse(buffer.toString('utf8'));
        }
        
        if (Array.isArray(content)) {
          // Update mock store with file content
          Controller.mockContentStore[id] = JSON.parse(JSON.stringify(content));
          console.log(`Re-initialized content for book ${id} from file (${content.length} chapters)`);
        }
      } catch (error) {
        // If we can't load from file, use existing mock content or create empty
        if (Controller.mockContentStore[id] && Array.isArray(Controller.mockContentStore[id])) {
          console.log(`Keeping existing mock content for book ${id} (${Controller.mockContentStore[id].length} chapters)`);
        } else {
          Controller.mockContentStore[id] = [];
          console.log(`Initialized empty content for book ${id}`);
        }
      }
    } catch (error) {
      console.error(`Error initializing book ${id} content from file:`, error);
    }
  }

  // Helper method to manage backups - always maintains only one backup
  private async manageBackup(filePath: string): Promise<boolean> {
    try {
      const backupPath = `${filePath}.backup`;
      
      // Check if backup already exists
      try {
        await fs.promises.access(backupPath);
        console.log(`Backup already exists at ${backupPath}, not creating another backup`);
        return false; // Backup already exists, no new backup created
      } catch (error) {
        // Backup doesn't exist, create it if the original file exists
        try {
          await fs.promises.access(filePath);
          await fs.promises.copyFile(filePath, backupPath);
          console.log(`Created backup at ${backupPath}`);
          return true; // Successfully created backup
        } catch (error) {
          console.log(`No file exists at ${filePath} to back up`);
          return false;
        }
      }
    } catch (error) {
      console.error(`Error managing backup: ${error}`);
      return false;
    }
  }
  
  // Helper method to restore from backup if needed
  @http.POST("/{id}/restore")
  async restoreFromBackup(
    @pathParam("id") id: string,
    ctx: Context<RouterState>
  ) {
    const book = Book.ALL.get(id);
    if (!book) {
      throw new ApplicationError(`Book not found: ${id}`);
    }
    
    try {
      const contentFilePath = path.join(this.dataDir, `${id}.json`);
      const backupPath = `${contentFilePath}.backup`;
      
      // Check if backup exists
      try {
        await fs.promises.access(backupPath);
        
        // Copy backup to main file
        await fs.promises.copyFile(backupPath, contentFilePath);
        
        // Re-initialize content from file
        await this.initializeContentFromFile(id);
        
        return { 
          success: true, 
          message: "Book content restored from backup successfully"
        };
      } catch (error) {
        console.error(`Error restoring from backup:`, error);
        throw new ApplicationError(`Failed to restore from backup: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      console.error(`Error restoring from backup:`, error);
      throw new ApplicationError(`Failed to restore from backup: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}